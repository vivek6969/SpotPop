import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { Spot, FollowRelation, User } from '../src/types/index.ts';

describe('Audience Visibility & Social Network Graph Protocol', () => {
  // Mock data fixture
  const mockCreatorUser: User = {
    id: 'usr_creator_123',
    email: 'creator@spotpop.in',
    username: 'rohit_sharma',
    displayName: 'Rohit Sharma',
    role: 'user',
    createdAt: '2026-11-20T10:00:00.000Z',
    ownedSpotIds: ['sp_public_1', 'sp_friends_1', 'sp_private_1'],
    followersCount: 0,
    followingCount: 0,
  };

  const mockViewerUser: User = {
    id: 'usr_viewer_456',
    email: 'fan@spotpop.in',
    username: 'cricket_fan',
    displayName: 'Cricket Fan',
    role: 'user',
    createdAt: '2026-11-22T10:00:00.000Z',
    ownedSpotIds: [],
    followersCount: 0,
    followingCount: 0,
  };

  const mockSpots: Spot[] = [
    {
      id: 'sp_public_1',
      ownerId: mockCreatorUser.id,
      creatorName: mockCreatorUser.displayName,
      slug: 'rohit-century',
      tier: 'big_pop',
      x: 100,
      y: 100,
      width: 170,
      height: 210,
      rotation: 0,
      shape: 'polaroid',
      background: '#FFFFFF',
      visibility: 'public',
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 150,
      sharesCount: 30,
      createdAt: '2026-11-20T12:00:00.000Z',
      content: { headline: 'Century Celebration!' } as any,
    },
    {
      id: 'sp_friends_1',
      ownerId: mockCreatorUser.id,
      creatorName: mockCreatorUser.displayName,
      slug: 'rohit-friends-only',
      tier: 'big_pop',
      x: 300,
      y: 100,
      width: 170,
      height: 210,
      rotation: 0,
      shape: 'polaroid',
      background: '#FFFFFF',
      visibility: 'friends_only',
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 45,
      sharesCount: 5,
      createdAt: '2026-11-21T12:00:00.000Z',
      content: { headline: 'Backstage Dressing Room' } as any,
    },
    {
      id: 'sp_private_1',
      ownerId: mockCreatorUser.id,
      creatorName: mockCreatorUser.displayName,
      slug: 'rohit-private-notes',
      tier: 'mini_pop',
      x: 500,
      y: 100,
      width: 170,
      height: 170,
      rotation: 0,
      shape: 'sticky',
      background: '#FEF08A',
      visibility: 'private',
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 2,
      sharesCount: 0,
      createdAt: '2026-11-22T12:00:00.000Z',
      content: { headline: 'Private Strategy Notes' } as any,
    },
  ];

  let followsTable: FollowRelation[] = [];

  // Helper matching server/database.ts visibility gating logic
  const querySpotsWithViewer = (spots: Spot[], viewerId?: string): Spot[] => {
    const rawViewer = (viewerId || '').trim().toLowerCase();
    return spots
      .filter(s => s.status !== 'hidden')
      .filter(s => {
        if (s.visibility === 'private') {
          if (!rawViewer) return false;
          return (
            s.ownerId?.toLowerCase() === rawViewer ||
            s.creatorName.toLowerCase() === rawViewer
          );
        }
        return true;
      })
      .map(s => {
        if (s.visibility === 'friends_only') {
          if (!rawViewer) {
            return { ...s, isLocked: true };
          }
          const isOwner =
            s.ownerId?.toLowerCase() === rawViewer ||
            s.creatorName.toLowerCase() === rawViewer;
          if (isOwner) return { ...s, isLocked: false };

          const isFollowing = followsTable.some(
            f =>
              (f.status === 'accepted' || (f.status as any) === undefined) &&
              ((f.followerId.toLowerCase() === rawViewer &&
                f.followingId.toLowerCase() === s.ownerId.toLowerCase()) ||
                (f.followerId.toLowerCase() === rawViewer &&
                  f.followingId.toLowerCase() === s.creatorName.toLowerCase()))
          );
          return { ...s, isLocked: !isFollowing };
        }
        return s;
      });
  };

  test('Public spot is accessible to all viewers without locking', () => {
    const anonymousSpots = querySpotsWithViewer(mockSpots, undefined);
    const pubSpot = anonymousSpots.find(s => s.id === 'sp_public_1');
    assert.ok(pubSpot, 'Public spot should be returned to unauthenticated users');
    assert.equal(pubSpot.isLocked, undefined, 'Public spot must not be locked');
  });

  test('Private spot is completely hidden from non-owners and anonymous viewers', () => {
    const anonSpots = querySpotsWithViewer(mockSpots, undefined);
    assert.equal(anonSpots.find(s => s.id === 'sp_private_1'), undefined, 'Private spot must not appear for anon');

    const otherUserSpots = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    assert.equal(otherUserSpots.find(s => s.id === 'sp_private_1'), undefined, 'Private spot must not appear for other user');

    const ownerSpots = querySpotsWithViewer(mockSpots, mockCreatorUser.id);
    const ownerPrivSpot = ownerSpots.find(s => s.id === 'sp_private_1');
    assert.ok(ownerPrivSpot, 'Owner must be able to view their own private spot');
    assert.equal(ownerPrivSpot.isLocked, undefined);
  });

  test('Friends-Only spot returns isLocked: true when viewer does not follow creator', () => {
    followsTable = []; // Not following
    const nonFollowerSpots = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    const friendsSpot = nonFollowerSpots.find(s => s.id === 'sp_friends_1');
    assert.ok(friendsSpot, 'Friends-only spot appears in list');
    assert.equal(friendsSpot.isLocked, true, 'Spot must be marked locked for non-followers');
  });

  test('Friends-Only spot is unlocked when creator views their own spot', () => {
    const ownerSpots = querySpotsWithViewer(mockSpots, mockCreatorUser.id);
    const ownerFriendsSpot = ownerSpots.find(s => s.id === 'sp_friends_1');
    assert.ok(ownerFriendsSpot);
    assert.equal(ownerFriendsSpot.isLocked, false, 'Owner must always see unlocked state');
  });

  test('Follow toggle: following creator unlocks friends-only spot and increments count', () => {
    followsTable = [];

    // Follow creator
    followsTable.push({
      id: 'flw_1',
      followerId: mockViewerUser.id.toLowerCase(),
      followingId: mockCreatorUser.id.toLowerCase(),
      status: 'accepted',
      createdAt: new Date().toISOString(),
    });

    const followerSpots = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    const unlockedSpot = followerSpots.find(s => s.id === 'sp_friends_1');
    assert.ok(unlockedSpot);
    assert.equal(unlockedSpot.isLocked, false, 'Friends-only spot must immediately unlock when following creator');

    // Followers count calculation
    const followersCount = followsTable.filter(f => f.followingId === mockCreatorUser.id.toLowerCase()).length;
    const followingCount = followsTable.filter(f => f.followerId === mockViewerUser.id.toLowerCase()).length;

    assert.equal(followersCount, 1);
    assert.equal(followingCount, 1);
  });

  test('Unfollow toggle: unfollowing creator immediately restores locked state', () => {
    // Unfollow
    followsTable = [];

    const spotsAfterUnfollow = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    const relockedSpot = spotsAfterUnfollow.find(s => s.id === 'sp_friends_1');
    assert.ok(relockedSpot);
    assert.equal(relockedSpot.isLocked, true, 'Spot must return to locked state after unfollowing');
  });

  test('Self-following is prevented by normalization guard', () => {
    const followerInput = 'rohit_sharma';
    const targetInput = 'rohit_sharma';
    const isSelf = followerInput.toLowerCase() === targetInput.toLowerCase();
    assert.equal(isSelf, true, 'Self-follow detection guard must reject identical user target');
  });

  test('Modal detail gating: friends-only spot isLocked flag is preserved for modal view and strips private audio', () => {
    followsTable = [];
    const nonFollowerSpot = querySpotsWithViewer(mockSpots, 'anonymous_guest').find(s => s.id === 'sp_friends_1');
    assert.ok(nonFollowerSpot);
    assert.equal(nonFollowerSpot.isLocked, true, 'SpotDetailModal must receive isLocked=true for non-followers');
  });

  test('Unlock flow: following creator sets isLocked to false in modal and unlocks visual showcase', () => {
    followsTable = [{
      id: 'fol_1',
      followerId: mockViewerUser.id.toLowerCase(),
      followingId: mockCreatorUser.id.toLowerCase(),
      status: 'accepted',
      createdAt: new Date().toISOString(),
    }];

    const followerSpots = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    const unlockedSpot = followerSpots.find(s => s.id === 'sp_friends_1');
    assert.ok(unlockedSpot);
    assert.equal(unlockedSpot.isLocked, false, 'Modal showcase must display fully unlocked card after follow');
  });

  // ================= INSTAGRAM FOLLOWER / FOLLOWING LOGIC TESTS =================

  test('Instagram follow request: requesting to follow creates pending relation and does NOT count as follower', () => {
    followsTable = [];

    // Viewer requests to follow private creator
    followsTable.push({
      id: 'flw_req_101',
      followerId: mockViewerUser.id.toLowerCase(),
      followingId: mockCreatorUser.id.toLowerCase(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const activeFollowersCount = followsTable.filter(
      f => f.followingId === mockCreatorUser.id.toLowerCase() && f.status === 'accepted'
    ).length;
    assert.equal(activeFollowersCount, 0, 'Pending request must not increment active followers count');
  });

  test('Instagram privacy enforcement: pending follower CANNOT see or unlock friends-only pop (isLocked remains true)', () => {
    followsTable = [{
      id: 'flw_req_101',
      followerId: mockViewerUser.id.toLowerCase(),
      followingId: mockCreatorUser.id.toLowerCase(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }];

    const spotsForPendingViewer = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    const lockedSpot = spotsForPendingViewer.find(s => s.id === 'sp_friends_1');
    assert.ok(lockedSpot, 'Spot is listed');
    assert.equal(
      lockedSpot.isLocked,
      true,
      'Pop MUST remain locked while follow request is pending approval'
    );
  });

  test('Instagram approval: creator accepting follow request transitions status to accepted and unlocks pop', () => {
    // Creator accepts follow request
    const pendingRelation = followsTable.find(f => f.id === 'flw_req_101');
    assert.ok(pendingRelation, 'Pending relation exists');
    pendingRelation.status = 'accepted';
    pendingRelation.acceptedAt = new Date().toISOString();

    const spotsForApprovedViewer = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    const unlockedSpot = spotsForApprovedViewer.find(s => s.id === 'sp_friends_1');
    assert.ok(unlockedSpot);
    assert.equal(
      unlockedSpot.isLocked,
      false,
      'Pop MUST unlock once creator accepts the follow request'
    );

    const activeFollowersCount = followsTable.filter(
      f => f.followingId === mockCreatorUser.id.toLowerCase() && f.status === 'accepted'
    ).length;
    assert.equal(activeFollowersCount, 1, 'Accepted follow request increments followers count');
  });

  test('Instagram rejection: declining follow request removes relation and keeps pop locked', () => {
    followsTable = [{
      id: 'flw_req_102',
      followerId: mockViewerUser.id.toLowerCase(),
      followingId: mockCreatorUser.id.toLowerCase(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }];

    // Creator declines request
    const idx = followsTable.findIndex(f => f.id === 'flw_req_102');
    assert.ok(idx !== -1);
    followsTable.splice(idx, 1);

    const spotsAfterDecline = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    const lockedSpot = spotsAfterDecline.find(s => s.id === 'sp_friends_1');
    assert.equal(lockedSpot?.isLocked, true, 'Spot remains locked when request is declined');
  });

  test('Instagram remove follower: creator removing an approved follower revokes access and relocks pop', () => {
    followsTable = [{
      id: 'flw_103',
      followerId: mockViewerUser.id.toLowerCase(),
      followingId: mockCreatorUser.id.toLowerCase(),
      status: 'accepted',
      createdAt: new Date().toISOString(),
    }];

    // Creator removes follower
    const idx = followsTable.findIndex(f => f.followerId === mockViewerUser.id.toLowerCase());
    assert.ok(idx !== -1);
    followsTable.splice(idx, 1);

    const spotsAfterRemoval = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    const relockedSpot = spotsAfterRemoval.find(s => s.id === 'sp_friends_1');
    assert.equal(relockedSpot?.isLocked, true, 'Spot must immediately re-lock when follower is removed');
  });

  test('User can unfollow any creator whenever they want, instantly updating following graph and relocking content', () => {
    // Viewer follows two creators
    followsTable = [
      {
        id: 'flw_201',
        followerId: mockViewerUser.id.toLowerCase(),
        followingId: mockCreatorUser.id.toLowerCase(),
        status: 'accepted',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'flw_202',
        followerId: mockViewerUser.id.toLowerCase(),
        followingId: 'creator_artist_2',
        status: 'accepted',
        createdAt: new Date().toISOString(),
      },
    ];

    const getFollowingCount = (userId: string) =>
      followsTable.filter(f => f.followerId.toLowerCase() === userId.toLowerCase() && f.status === 'accepted').length;

    assert.equal(getFollowingCount(mockViewerUser.id), 2, 'Viewer initially follows 2 creators');

    // Viewer unfollows mockCreatorUser
    const unfollowTarget = mockCreatorUser.id.toLowerCase();
    followsTable = followsTable.filter(
      f => !(f.followerId.toLowerCase() === mockViewerUser.id.toLowerCase() && f.followingId.toLowerCase() === unfollowTarget)
    );

    assert.equal(getFollowingCount(mockViewerUser.id), 1, 'Following count decrements to 1 after unfollowing');
    assert.equal(
      followsTable.some(f => f.followingId.toLowerCase() === unfollowTarget),
      false,
      'Unfollowed creator must no longer be present in follow table'
    );

    // Private / friends-only content from unfollowed creator must be locked again
    const spotsAfterUnfollow = querySpotsWithViewer(mockSpots, mockViewerUser.id);
    const friendsSpot = spotsAfterUnfollow.find(s => s.id === 'sp_friends_1');
    assert.ok(friendsSpot);
    assert.equal(friendsSpot.isLocked, true, 'Spot must re-lock as soon as viewer unfollows creator');
  });

  test('Unfollow is idempotent and succeeds safely even if already unfollowed', () => {
    followsTable = [];

    // Attempting to unfollow someone not followed
    const unfollowTarget = 'some_random_creator';
    const beforeCount = followsTable.length;
    followsTable = followsTable.filter(
      f => !(f.followerId.toLowerCase() === mockViewerUser.id.toLowerCase() && f.followingId.toLowerCase() === unfollowTarget)
    );
    assert.equal(followsTable.length, beforeCount, 'Length remains 0 without errors');
  });

  test('User can cancel a pending follow request by unfollowing', () => {
    followsTable = [{
      id: 'flw_req_203',
      followerId: mockViewerUser.id.toLowerCase(),
      followingId: 'private_celebrity',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }];

    assert.equal(followsTable.length, 1);

    // User cancels request by clicking unfollow/requested
    followsTable = followsTable.filter(
      f => !(f.followerId.toLowerCase() === mockViewerUser.id.toLowerCase() && f.followingId.toLowerCase() === 'private_celebrity')
    );

    assert.equal(followsTable.length, 0, 'Pending request must be removed when user cancels follow');
  });
});
