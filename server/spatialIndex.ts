import type { Spot } from '../src/types/index.ts';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ActiveReservation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  expiresAt: number;
}

/**
 * 2D Spatial Hash Grid for high-performance $O(1)$ collision detection
 * and viewport bounding-box queries over large spot collections.
 */
export class SpatialIndex {
  private cellSize: number;
  private cells: Map<string, Set<string>> = new Map();
  private spotMap: Map<string, Spot> = new Map();
  private spotToCells: Map<string, string[]> = new Map();

  // Active reservations to ensure concurrency safety during simultaneous spot purchases
  private reservations: Map<string, ActiveReservation> = new Map();

  constructor(cellSize: number = 500) {
    this.cellSize = cellSize;
  }

  private cellCoord(val: number): number {
    return Math.floor(val / this.cellSize);
  }

  private cellKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  private getOverlappingCellKeys(minX: number, minY: number, maxX: number, maxY: number): string[] {
    const minCx = this.cellCoord(minX);
    const maxCx = this.cellCoord(maxX);
    const minCy = this.cellCoord(minY);
    const maxCy = this.cellCoord(maxY);

    const keys: string[] = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        keys.push(this.cellKey(cx, cy));
      }
    }
    return keys;
  }

  /**
   * Insert a spot into the spatial grid
   */
  insert(spot: Spot): void {
    if (!spot || !spot.id) return;

    // Remove if already indexed to prevent duplicates
    if (this.spotMap.has(spot.id)) {
      this.remove(spot.id);
    }

    const halfW = (spot.width || 170) / 2;
    const halfH = (spot.height || 170) / 2;
    const keys = this.getOverlappingCellKeys(
      spot.x - halfW,
      spot.y - halfH,
      spot.x + halfW,
      spot.y + halfH
    );

    for (const key of keys) {
      let cell = this.cells.get(key);
      if (!cell) {
        cell = new Set<string>();
        this.cells.set(key, cell);
      }
      cell.add(spot.id);
    }

    this.spotMap.set(spot.id, spot);
    this.spotToCells.set(spot.id, keys);
  }

  /**
   * Bulk insert an array of spots into the spatial index
   */
  bulkInsert(spots: Spot[]): void {
    for (const spot of spots) {
      if (spot.status !== 'hidden') {
        this.insert(spot);
      }
    }
  }

  /**
   * Remove a spot from the spatial index
   */
  remove(spotId: string): boolean {
    const keys = this.spotToCells.get(spotId);
    if (!keys) return false;

    for (const key of keys) {
      const cell = this.cells.get(key);
      if (cell) {
        cell.delete(spotId);
        if (cell.size === 0) {
          this.cells.delete(key);
        }
      }
    }

    this.spotToCells.delete(spotId);
    this.spotMap.delete(spotId);
    return true;
  }

  /**
   * Clear the entire spatial index
   */
  clear(): void {
    this.cells.clear();
    this.spotMap.clear();
    this.spotToCells.clear();
    this.reservations.clear();
  }

  /**
   * Query spots that intersect a given viewport bounding box
   */
  queryBBox(minX: number, minY: number, maxX: number, maxY: number, limit: number = 2000): Spot[] {
    const keys = this.getOverlappingCellKeys(minX, minY, maxX, maxY);
    const candidateIds = new Set<string>();

    for (const key of keys) {
      const cell = this.cells.get(key);
      if (cell) {
        for (const id of cell) {
          candidateIds.add(id);
        }
      }
    }

    const results: Spot[] = [];
    for (const id of candidateIds) {
      const spot = this.spotMap.get(id);
      if (!spot || spot.status === 'hidden') continue;

      const halfW = (spot.width || 170) / 2;
      const halfH = (spot.height || 170) / 2;
      const sLeft = spot.x - halfW;
      const sRight = spot.x + halfW;
      const sTop = spot.y - halfH;
      const sBottom = spot.y + halfH;

      // Exact AABB intersection
      const intersects = !(sLeft > maxX || sRight < minX || sTop > maxY || sBottom < minY);
      if (intersects) {
        results.push(spot);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Check collision with both existing spots and active concurrency reservations
   */
  checkCollision(cx: number, cy: number, w: number, h: number, padding: number): boolean {
    const left1 = cx - w / 2 - padding;
    const right1 = cx + w / 2 + padding;
    const top1 = cy - h / 2 - padding;
    const bottom1 = cy + h / 2 + padding;

    // 1. Check against active in-flight reservations
    this.cleanExpiredReservations();
    for (const res of this.reservations.values()) {
      const left2 = res.x - res.width / 2;
      const right2 = res.x + res.width / 2;
      const top2 = res.y - res.height / 2;
      const bottom2 = res.y + res.height / 2;

      const overlaps = !(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2);
      if (overlaps) return true;
    }

    // 2. Check against spatial grid of committed spots (only in overlapping cells)
    const keys = this.getOverlappingCellKeys(left1, top1, right1, bottom1);
    const checkedSpotIds = new Set<string>();

    for (const key of keys) {
      const cell = this.cells.get(key);
      if (!cell) continue;

      for (const spotId of cell) {
        if (checkedSpotIds.has(spotId)) continue;
        checkedSpotIds.add(spotId);

        const s = this.spotMap.get(spotId);
        if (!s || s.status === 'hidden') continue;

        const sHalfW = (s.width || 170) / 2;
        const sHalfH = (s.height || 170) / 2;
        const left2 = s.x - sHalfW;
        const right2 = s.x + sHalfW;
        const top2 = s.y - sHalfH;
        const bottom2 = s.y + sHalfH;

        const overlaps = !(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2);
        if (overlaps) return true;
      }
    }

    return false;
  }

  // =================== CONCURRENCY RESERVATION CONTROLS ===================

  cleanExpiredReservations(): void {
    const now = Date.now();
    for (const [id, res] of this.reservations.entries()) {
      if (now > res.expiresAt) {
        this.reservations.delete(id);
      }
    }
  }

  /**
   * Temporarily lock coordinates during payment checkout to prevent concurrent collisions
   */
  reserveCoordinate(
    x: number,
    y: number,
    width: number,
    height: number,
    ttlMs: number = 300000 // 5 minutes reservation TTL
  ): string {
    this.cleanExpiredReservations();
    const id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.reservations.set(id, {
      id,
      x,
      y,
      width,
      height,
      expiresAt: Date.now() + ttlMs,
    });
    return id;
  }

  releaseReservation(id: string): void {
    this.reservations.delete(id);
  }

  size(): number {
    return this.spotMap.size;
  }
}

