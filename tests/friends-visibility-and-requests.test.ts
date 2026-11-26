import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../server/database';
import { Spot } from '../src/types';

describe('Friends-Only Visibility & Real-Time Requests Engine', () => {
  // Test fixture setup
  const user1Id = 'usr_test_u1';
  const user1Username = 'test_user1';
  const user2Id = 'usr_test_u2';
  const user2Username = 'test_user2';
  const user3Id = 'usr_test_u3';
  const user3Username = 'test_user3';

  // Seed users in database with public profiles initially
  const u1Obj = db.getUserById(user1Id);
  if (u1Obj) {
    u1Obj.isPrivate = false;
  } else {
    db.addUser({
      id: user1Id,
      username: user1Username,
      displayName: 'Test User 1',
      email: 'test_u1@spotpop.in',
      role: 'creator',
      isPrivate: false,
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    });
  }

  db.addUser({
    id: user2Id,
    username: user2Username,
    displayName: 'Test User 2',
    email: 'test_u2@spotpop.in',
    role: 'creator',
    createdAt: new Date().toISOString(),
    ownedSpotIds: [],
  });

  db.addUser({
    id: user3Id,
    username: user3Username,
    displayName: 'Test User 3',
    email: 'test_u3@spotpop.in',
    role: 'creator',
    createdAt: new Date().toISOString(),
    ownedSpotIds: [],
  });

  // Create a Friends-Only spot owned by User 1
  const friendsSpot: Spot = {
    id: 'sp_test_friends_only_1',
    ownerId: user1Id,
    creatorName: user1Username,
    slug: 'test-user1-friends-spot',
    tier: 'mini_pop',
    title: 'Secret Friends Memory',
    x: 50,
    y: 50,
    width: 170,
    height: 170,
    rotation: 0,
    shape: 'sticky',
    background: '#FEF08A',
    content: {
      headline: 'Secret Friends Memory',
      text: 'Only mutuals should see this',
      textColor: '#000000',
      fontFamily: 'Caveat',
      fontSize: 22,
      textOpacity: 1,
      alignment: 'center',
      stickers: [],
      frameStyle: 'pin',
    },
    createdAt: new Date().toISOString(),
    status: 'published',
    visibility: 'friends_only',
    moderationStatus: 'approved',
  };

  // Add spot to db
  (db as any).data.spots = (db as any).data.spots.filter((s: Spot) => s.id !== friendsSpot.id);
  (db as any).data.spots.push(friendsSpot);

  test('Logged-out visitor (anonymous) CANNOT see friends-only spots', () => {
    // When logged out, getSpots() is called with no viewer
    const loggedOutSpots = db.getSpots(undefined);
    const found = loggedOutSpots.find(s => s.id === friendsSpot.id);
    assert.equal(
      found,
      undefined,
      'Friends-only spot MUST be completely hidden when no one is logged in'
    );

    // Viewport query must also completely exclude friends-only spot when logged out
    const viewportSpots = db.queryViewport(-500, -500, 500, 500, 100, undefined);
    assert.equal(
      viewportSpots.find(s => s.id === friendsSpot.id),
      undefined,
      'queryViewport MUST NOT return friends-only spot when logged out'
    );
  });

  test('Owner (User 1) CAN see their own friends-only spot unlocked', () => {
    const ownerSpots = db.getSpots(user1Id);
    const found = ownerSpots.find(s => s.id === friendsSpot.id);
    assert.ok(found, 'Owner must be able to view their own friends-only spot');
    assert.equal(found.isLocked, false, 'Owner must see unlocked state');
  });

  test('User 2 follows User 1 -> User 2 immediately sees friends-only spot unlocked', () => {
    // Before following: user2 does not see spot unlocked
    db.unfollowUser(user2Id, user1Username);

    // Follow User 1
    const followRes = db.followUser(user2Id, user1Username);
    assert.equal(followRes.isFollowing, true);

    // User 2 fetches spots
    const user2Spots = db.getSpots(user2Id);
    const found = user2Spots.find(s => s.id === friendsSpot.id);
    assert.ok(found, 'Follower (User 2) must be able to see the friends-only spot');
    assert.equal(found.isLocked, false, 'Follower must see unlocked content');
  });

  test('User 3 (stranger, not following User 1) sees isLocked: true', () => {
    // Ensure User 3 is definitely not following User 1
    db.unfollowUser(user3Id, user1Username);

    const user3Spots = db.getSpots(user3Id);
    const found = user3Spots.find(s => s.id === friendsSpot.id);
    assert.ok(found, 'Logged-in user sees friends spot exists');
    assert.equal(found.isLocked, true, 'Non-follower must receive locked state');
  });

  test('Pending follow request does not unlock spot until creator accepts', () => {
    // Make User 1 a private account
    const u1 = db.getUserById(user1Id);
    if (u1) u1.isPrivate = true;

    // User 3 unfollows and requests to follow
    db.unfollowUser(user3Id, user1Username);
    const reqRes = db.followUser(user3Id, user1Username);
    assert.equal(reqRes.isRequested, true, 'Request should be pending');

    // While pending, spot remains locked
    const pendingSpots = db.getSpots(user3Id);
    const foundPending = pendingSpots.find(s => s.id === friendsSpot.id);
    assert.equal(foundPending?.isLocked, true, 'Pending requester still sees locked spot');

    // User 1 accepts the request
    const pendingReqs = db.getFollowRequests(user1Username);
    const targetReq = pendingReqs.find(r => r.username === user3Username || r.followerId === user3Id);
    assert.ok(targetReq, 'Pending request must appear in User 1 requests list');

    const acceptRes = db.acceptFollowRequest(targetReq.id, user1Username);
    assert.ok(acceptRes?.success, 'Follow request accepted');

    // Now User 3 can view spot unlocked!
    const acceptedSpots = db.getSpots(user3Id);
    const foundAccepted = acceptedSpots.find(s => s.id === friendsSpot.id);
    assert.equal(foundAccepted?.isLocked, false, 'Accepted friend must see spot unlocked');

    // Clean up test relations and spots
    db.unfollowUser(user2Id, user1Username);
    db.unfollowUser(user3Id, user1Username);
    if (u1) u1.isPrivate = false;
    (db as any).data.spots = (db as any).data.spots.filter((s: Spot) => s.id !== friendsSpot.id);
    (db as any).data.users = (db as any).data.users.filter((u: any) => ![user1Id, user2Id, user3Id].includes(u.id));
    (db as any).save();
  });
});
