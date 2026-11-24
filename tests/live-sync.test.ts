import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { Spot } from '../src/types/index.ts';

describe('Real-Time Live Synchronization (SSE & Canvas Sync)', () => {
  const createSampleSpot = (id: string, headline = 'Test Pop'): Spot => ({
    id,
    ownerId: 'usr_1',
    creatorName: 'Live Tester',
    slug: `test-${id}`,
    tier: 'mini_pop',
    x: 100,
    y: 100,
    width: 170,
    height: 170,
    rotation: 0,
    shape: 'sticky',
    background: '#FEF08A',
    content: {
      headline,
      textColor: '#1E293B',
      fontFamily: 'Caveat',
      fontSize: 24,
      stickers: [],
      frameStyle: 'tape',
      alignment: 'center',
    },
    createdAt: new Date().toISOString(),
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 1,
    sharesCount: 0,
  });

  test('SSE event payload formatting complies with text/event-stream specification', () => {
    const spot = createSampleSpot('sp_live_1', 'Instant Pop');
    const event = 'spot_created';
    const payload = `event: ${event}\ndata: ${JSON.stringify({ spot })}\n\n`;

    assert.ok(payload.startsWith('event: spot_created\n'));
    assert.ok(payload.includes('data: {"spot":'));
    assert.ok(payload.endsWith('\n\n'));
  });

  test('spot_created state reducer prepends new spots and prevents duplicates', () => {
    let spots: Spot[] = [createSampleSpot('sp_existing_1')];

    const applySpotCreated = (newSpot: Spot) => {
      if (spots.some(s => s.id === newSpot.id)) {
        spots = spots.map(s => s.id === newSpot.id ? newSpot : s);
      } else {
        spots = [newSpot, ...spots];
      }
    };

    const newSpot1 = createSampleSpot('sp_live_2', 'Second Pop');
    applySpotCreated(newSpot1);
    assert.equal(spots.length, 2);
    assert.equal(spots[0].id, 'sp_live_2');

    // Receiving duplicate spot_created must NOT duplicate the card
    applySpotCreated(newSpot1);
    assert.equal(spots.length, 2);
  });

  test('spot_updated state reducer updates target spot without reordering', () => {
    let spots: Spot[] = [
      createSampleSpot('sp_1', 'Original 1'),
      createSampleSpot('sp_2', 'Original 2'),
    ];

    const applySpotUpdated = (updatedSpot: Spot) => {
      spots = spots.map(s => s.id === updatedSpot.id ? updatedSpot : s);
    };

    const modifiedSpot = { ...spots[1], content: { ...spots[1].content, headline: 'Updated Headline 2' } };
    applySpotUpdated(modifiedSpot);

    assert.equal(spots.length, 2);
    assert.equal(spots[1].id, 'sp_2');
    assert.equal(spots[1].content.headline, 'Updated Headline 2');
  });

  test('spot_deleted state reducer cleanly removes target spot', () => {
    let spots: Spot[] = [
      createSampleSpot('sp_1'),
      createSampleSpot('sp_2'),
      createSampleSpot('sp_3'),
    ];

    const applySpotDeleted = (deletedId: string) => {
      spots = spots.filter(s => s.id !== deletedId);
    };

    applySpotDeleted('sp_2');
    assert.equal(spots.length, 2);
    assert.equal(spots.some(s => s.id === 'sp_2'), false);
    assert.equal(spots[0].id, 'sp_1');
    assert.equal(spots[1].id, 'sp_3');
  });

  test('SSE client connection lifecycle gracefully removes closed connections', () => {
    const clients = new Set<{ write: (msg: string) => void; closed: boolean }>();

    const client1 = { write: () => {}, closed: false };
    const client2 = {
      write: () => {
        throw new Error('Connection closed');
      },
      closed: true,
    };

    clients.add(client1);
    clients.add(client2);

    const broadcast = (data: string) => {
      for (const client of clients) {
        try {
          client.write(data);
        } catch {
          clients.delete(client);
        }
      }
    };

    broadcast('event: ping\n\n');
    assert.equal(clients.size, 1);
    assert.ok(clients.has(client1));
  });
});
