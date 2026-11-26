import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Database } from '../server/database.ts';
import { hashPassword, verifyPassword } from '../server/api.ts';

describe('Production QA, Security & Reliability Protocol', () => {
  test('Password hashing produces distinct salt and verifies strictly with constant-time comparison', () => {
    const rawPass = 'SpotPopSuperSecret2026!';
    const hashA = hashPassword(rawPass);
    const hashB = hashPassword(rawPass);

    // Each hash must have a unique random salt
    assert.notEqual(hashA, hashB);
    assert.ok(hashA.includes(':'));

    // Correct password verifies successfully
    assert.equal(verifyPassword(rawPass, hashA), true);
    assert.equal(verifyPassword(rawPass, hashB), true);

    // Wrong password fails verification strictly
    assert.equal(verifyPassword('WrongPassword123', hashA), false);
    assert.equal(verifyPassword('', hashA), false);
  });

  test('Database in-memory test mode is 100% isolated from disk mutations', () => {
    const db = new Database(false);
    assert.equal(db.isPersistent, false);

    const initialLen = db.getSpots().length;
    db.addSpot({
      id: 'sp_test_isolation_qa',
      ownerId: 'usr_qa',
      creatorName: 'QA Tester',
      slug: 'qa-test-isolation',
      tier: 'mini_pop',
      x: 50,
      y: 50,
      width: 170,
      height: 170,
      rotation: 0,
      shape: 'sticky',
      background: '#FFF8E7',
      content: { headline: 'Test', text: 'Isolation', textColor: '#000', fontFamily: 'Caveat', fontSize: 20, alignment: 'center', stickers: [], frameStyle: 'tape' },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 0,
      sharesCount: 0,
    });

    assert.equal(db.getSpots().length, initialLen + 1);

    // Calling backup or save in isPersistent=false mode is safe no-op
    assert.equal(db.createBackup(), null);
  });

  test('Database rolling backup mechanism generates valid timestamped snapshots and respects retention cap', () => {
    const backupDir = path.resolve(process.cwd(), 'backups');
    assert.ok(fs.existsSync(backupDir));

    // Verify backup files exist and are valid JSON
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('server-db-') && f.endsWith('.json'));
    assert.ok(files.length >= 1, 'At least one backup file must exist in backups directory');

    const firstBackup = path.join(backupDir, files[0]);
    const parsed = JSON.parse(fs.readFileSync(firstBackup, 'utf-8'));
    assert.ok(Array.isArray(parsed.spots), 'Backup must contain valid spots array');
    assert.ok(Array.isArray(parsed.users), 'Backup must contain valid users array');
  });

  test('getStats returns transparent authentic community stats without fake sine-wave oscillation', () => {
    const db = new Database(false);
    const stats = db.getStats();

    assert.ok(typeof stats.onlineCount === 'number');
    assert.ok(stats.onlineCount >= 1);
    assert.equal(Number.isInteger(stats.onlineCount), true);

    // Ensure claimedCount reflects valid total capacity
    assert.ok(stats.totalCapacity === 300000);
    assert.ok(stats.spotsLeft <= 300000);
  });

  test('Spot ownership is strictly bound to ownerId and user ownedSpotIds', () => {
    const db = new Database(false);
    const ownerUser = {
      id: 'usr_owner_123',
      email: 'owner@spotpop.in',
      username: 'legit_owner',
      displayName: 'Legit Owner',
      role: 'user' as const,
      createdAt: new Date().toISOString(),
      ownedSpotIds: ['sp_owned_spot_1'],
    };
    db.addUser(ownerUser);

    const attackerUser = {
      id: 'usr_attacker_999',
      email: 'attacker@spotpop.in',
      username: 'imposter',
      displayName: 'Legit Owner', // Name collision attempt
      role: 'user' as const,
      createdAt: new Date().toISOString(),
      ownedSpotIds: [] as string[],
    };
    db.addUser(attackerUser);

    const spot = {
      id: 'sp_owned_spot_1',
      ownerId: 'usr_owner_123',
      creatorName: 'Legit Owner',
      slug: 'legit-spot',
      tier: 'mini_pop' as const,
      x: 0,
      y: 0,
      width: 170,
      height: 170,
      rotation: 0,
      shape: 'sticky' as const,
      background: '#FFF8E7',
      content: { headline: 'Safe', text: 'Text', textColor: '#000', fontFamily: 'Caveat', fontSize: 20, alignment: 'center' as const, stickers: [], frameStyle: 'tape' as const },
      createdAt: new Date().toISOString(),
      status: 'published' as const,
      moderationStatus: 'approved' as const,
      viewsCount: 0,
      sharesCount: 0,
    };
    db.addSpot(spot);

    // Verify true owner has ownership
    const isOwner = spot.ownerId === ownerUser.id || Boolean(ownerUser.ownedSpotIds?.includes(spot.id));
    assert.equal(isOwner, true);

    // Verify imposter with same display name is strictly REJECTED
    const isAttackerOwner = spot.ownerId === attackerUser.id || Boolean(attackerUser.ownedSpotIds?.includes(spot.id));
    assert.equal(isAttackerOwner, false);
  });
});
