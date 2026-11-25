import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Database } from '../server/database';
import { User, Spot } from '../src/types';

describe('Connected Pops (Memory Threads) & Permission Engine', () => {
  it('allows owner, tagged friend, or follower to connect pops bidirectionally', () => {
    const db = new Database();
    const nonce = Math.random().toString(36).substring(2, 7);

    // Create Creator A and Pop A
    const creatorA: User = {
      id: `usr_alice_${nonce}`,
      email: `alice_${nonce}@example.com`,
      username: `alice_${nonce}`,
      displayName: `Alice ${nonce}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    db.addUser(creatorA);

    const spotA: Spot = {
      id: `sp_alice_${nonce}`,
      x: 100,
      y: 100,
      width: 170,
      height: 170,
      tier: 'mini_pop',
      slug: 'test-spot',
      rotation: 0,
      shape: 'sticky',
      background: '#FEF08A',
      creatorName: creatorA.username,
      ownerId: creatorA.id,
      title: "Alice's Birthday Party",
      description: 'Celebrating 25th birthday with friends!',
      location: 'Goa Beach Resort',
      tags: ['birthday', 'party', 'friends'],
      taggedUsers: [`bob_${nonce}`, 'charlie_chef'],
      content: { headline: "Alice's Birthday", text: '', author: '', textColor: '#000', fontFamily: 'Caveat', fontSize: 24, alignment: 'center', stickers: [], frameStyle: 'tape' },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 10,
      sharesCount: 2,
    };
    db.addSpot(spotA);

    // Create Creator B and Pop B
    const creatorB: User = {
      id: `usr_bob_${nonce}`,
      email: `bob_${nonce}@example.com`,
      username: `bob_${nonce}`,
      displayName: `Bob ${nonce}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    db.addUser(creatorB);

    const spotB: Spot = {
      id: `sp_bob_${nonce}`,
      x: 300,
      y: 100,
      width: 170,
      height: 170,
      tier: 'mini_pop',
      slug: 'test-spot',
      rotation: 0,
      shape: 'sticky',
      background: '#BAE6FD',
      creatorName: creatorB.username,
      ownerId: creatorB.id,
      title: "Bob's Gift to Alice",
      description: 'The surprise cake we got for Alice!',
      location: 'Goa Beach Resort',
      tags: ['cake', 'surprise', 'friends'],
      content: { headline: 'Surprise Cake!', text: '', author: '', textColor: '#000', fontFamily: 'Caveat', fontSize: 24, alignment: 'center', stickers: [], frameStyle: 'tape' },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 5,
      sharesCount: 1,
    };
    db.addSpot(spotB);

    // Verify Bob (tagged in Spot A and owner of Spot B) can connect them
    const canBobConnectA = db.canUserConnectSpot(creatorB.username, spotA);
    const canBobConnectB = db.canUserConnectSpot(creatorB.username, spotB);
    assert.strictEqual(canBobConnectA, true, 'Tagged user Bob should be permitted to connect spot A');
    assert.strictEqual(canBobConnectB, true, 'Owner Bob should be permitted to connect spot B');

    // Connect them
    const connectResult = db.connectSpots(spotA.id, spotB.id, creatorB.username);
    assert.strictEqual(connectResult.success, true);
    assert.ok(connectResult.spotA?.connectedSpotIds?.includes(spotB.id));
    assert.ok(connectResult.spotB?.connectedSpotIds?.includes(spotA.id));

    // Verify mutual bidirectional linking in db
    const updatedA = db.getSpotById(spotA.id);
    const updatedB = db.getSpotById(spotB.id);
    assert.ok(updatedA?.connectedSpotIds?.includes(spotB.id), 'Spot A should contain Spot B ID');
    assert.ok(updatedB?.connectedSpotIds?.includes(spotA.id), 'Spot B should contain Spot A ID');

    // Query connected spots from API method
    const connectedToA = db.getConnectedSpots(spotA.id, creatorA.username);
    assert.strictEqual(connectedToA.length, 1);
    assert.strictEqual(connectedToA[0].id, spotB.id);

    // Disconnect spots
    const disconnectResult = db.disconnectSpots(spotA.id, spotB.id, creatorA.username);
    assert.strictEqual(disconnectResult.success, true);

    const postDisconnectA = db.getSpotById(spotA.id);
    const postDisconnectB = db.getSpotById(spotB.id);
    assert.ok(!postDisconnectA?.connectedSpotIds?.includes(spotB.id), 'Spot A should no longer contain Spot B ID');
    assert.ok(!postDisconnectB?.connectedSpotIds?.includes(spotA.id), 'Spot B should no longer contain Spot A ID');
  });

  it('rejects connection by unrelated random user', () => {
    const db = new Database();
    const nonce = Math.random().toString(36).substring(2, 7);

    const creatorA: User = {
      id: `usr_sara_${nonce}`,
      email: `sara_${nonce}@example.com`,
      username: `sara_${nonce}`,
      displayName: `Sara ${nonce}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    db.addUser(creatorA);

    const spotA: Spot = {
      id: `sp_sara_${nonce}`,
      x: 10,
      y: 10,
      width: 170,
      height: 170,
      tier: 'mini_pop',
      slug: 'test-spot',
      rotation: 0,
      shape: 'sticky',
      background: '#FEF08A',
      creatorName: creatorA.username,
      ownerId: creatorA.id,
      title: 'Solo Pop',
      content: { headline: 'Solo Song', text: '', author: '', textColor: '#000', fontFamily: 'Caveat', fontSize: 24, alignment: 'center', stickers: [], frameStyle: 'tape' },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 0,
      sharesCount: 0,
    };
    db.addSpot(spotA);

    const creatorB: User = {
      id: `usr_dave_${nonce}`,
      email: `dave_${nonce}@example.com`,
      username: `dave_${nonce}`,
      displayName: `Dave ${nonce}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    db.addUser(creatorB);

    const spotB: Spot = {
      id: `sp_dave_${nonce}`,
      x: 50,
      y: 50,
      width: 170,
      height: 170,
      tier: 'mini_pop',
      slug: 'test-spot',
      rotation: 0,
      shape: 'sticky',
      background: '#BAE6FD',
      creatorName: creatorB.username,
      ownerId: creatorB.id,
      title: 'Dance Pop',
      content: { headline: 'Dance Routine', text: '', author: '', textColor: '#000', fontFamily: 'Caveat', fontSize: 24, alignment: 'center', stickers: [], frameStyle: 'tape' },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 0,
      sharesCount: 0,
    };
    db.addSpot(spotB);

    // Random user with no relationship to either spot
    const canStrangerConnectA = db.canUserConnectSpot('stranger_user', spotA);
    assert.strictEqual(canStrangerConnectA, false, 'Unrelated stranger must NOT be permitted to connect spot A');

    const connectRes = db.connectSpots(spotA.id, spotB.id, 'stranger_user');
    assert.strictEqual(connectRes.success, false);
    assert.match(connectRes.error || '', /only connect Pops/i);
  });

  it('allows follower of creator to connect pops', () => {
    const db = new Database();
    const nonce = Math.random().toString(36).substring(2, 7);

    const creatorA: User = {
      id: `usr_priya_${nonce}`,
      email: `priya_${nonce}@example.com`,
      username: `priya_${nonce}`,
      displayName: `Priya ${nonce}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    db.addUser(creatorA);

    const follower: User = {
      id: `usr_rohit_${nonce}`,
      email: `rohit_${nonce}@example.com`,
      username: `rohit_${nonce}`,
      displayName: `Rohit ${nonce}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    db.addUser(follower);

    // Ensure follow relation
    const followRes = db.followUser(follower.username, creatorA.username);
    assert.strictEqual(followRes.followStatus, 'accepted');

    const spotA: Spot = {
      id: `sp_priya_${nonce}`,
      x: 200,
      y: 200,
      width: 170,
      height: 170,
      tier: 'mini_pop',
      slug: 'test-spot',
      rotation: 0,
      shape: 'sticky',
      background: '#FEF08A',
      creatorName: creatorA.username,
      ownerId: creatorA.id,
      title: "Priya's Exhibition",
      content: { headline: 'Art Fair', text: '', author: '', textColor: '#000', fontFamily: 'Caveat', fontSize: 24, alignment: 'center', stickers: [], frameStyle: 'tape' },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 0,
      sharesCount: 0,
    };
    db.addSpot(spotA);

    const spotRohit: Spot = {
      id: `sp_rohit_${nonce}`,
      x: 250,
      y: 200,
      width: 170,
      height: 170,
      tier: 'mini_pop',
      slug: 'test-spot',
      rotation: 0,
      shape: 'sticky',
      background: '#E9D5FF',
      creatorName: follower.username,
      ownerId: follower.id,
      title: 'At the exhibition with Priya!',
      content: { headline: 'Awesome Show', text: '', author: '', textColor: '#000', fontFamily: 'Caveat', fontSize: 24, alignment: 'center', stickers: [], frameStyle: 'tape' },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 0,
      sharesCount: 0,
    };
    db.addSpot(spotRohit);

    const canFollowerConnectA = db.canUserConnectSpot(follower.username, spotA);
    const canFollowerConnectRohit = db.canUserConnectSpot(follower.username, spotRohit);
    assert.strictEqual(canFollowerConnectA, true, 'Follower of Priya should be permitted to connect spot A');
    assert.strictEqual(canFollowerConnectRohit, true, 'Owner of spotRohit should be permitted to connect');

    const res = db.connectSpots(spotA.id, spotRohit.id, follower.username);
    assert.strictEqual(res.success, true);
  });
});
