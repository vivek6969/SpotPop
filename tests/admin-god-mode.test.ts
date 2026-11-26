import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Database } from '../server/database.ts';
import type { User, Spot, Order, Comment } from '../src/types/index.ts';

describe('Advanced God-Mode Admin Architecture & Data Operations', () => {
  let db: Database;

  beforeEach(() => {
    // Instantiate isolated in-memory test database (isPersistent = false)
    db = new Database(false);
  });

  it('guarantees administrator can create new user accounts with full profile parameters', () => {
    const newUser: User = {
      id: 'usr_test_god_1',
      email: 'godmode@spotpop.test',
      username: 'godcreator',
      displayName: 'God Creator',
      role: 'user',
      bio: 'Admin created bio',
      websiteUrl: 'https://spotpop.in',
      isPrivate: true,
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };

    db.addUser(newUser);
    const retrieved = db.getUserById('usr_test_god_1');
    assert.ok(retrieved, 'New user must exist in database');
    assert.equal(retrieved.username, 'godcreator');
    assert.equal(retrieved.email, 'godmode@spotpop.test');
    assert.equal(retrieved.role, 'user');
    assert.equal(retrieved.isPrivate, true);
    assert.equal(retrieved.websiteUrl, 'https://spotpop.in');
  });

  it('guarantees administrator can edit any user account property including role promotion', () => {
    const user: User = {
      id: 'usr_promote_me',
      email: 'promote@spotpop.test',
      username: 'regulardude',
      displayName: 'Regular Dude',
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    db.addUser(user);

    // Promote to admin and update displayName
    const updated = db.updateUser('usr_promote_me', {
      role: 'admin',
      displayName: 'Supreme Admin Dude',
      bio: 'Promoted by master admin',
    });

    assert.ok(updated, 'Update user must return updated object');
    assert.equal(updated.role, 'admin', 'User must be promoted to admin');
    assert.equal(updated.displayName, 'Supreme Admin Dude');
    assert.equal(updated.bio, 'Promoted by master admin');
  });

  it('guarantees administrator can delete users individually and in batch', () => {
    const user1: User = {
      id: 'usr_delete_1',
      email: 'del1@spotpop.test',
      username: 'deleteone',
      displayName: 'Delete One',
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    const user2: User = {
      id: 'usr_delete_2',
      email: 'del2@spotpop.test',
      username: 'deletetwo',
      displayName: 'Delete Two',
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    db.addUser(user1);
    db.addUser(user2);

    assert.ok(db.getUserById('usr_delete_1'));
    assert.ok(db.getUserById('usr_delete_2'));

    // Single delete
    const singleDeleted = db.deleteUser('usr_delete_1');
    assert.equal(singleDeleted, true);
    assert.equal(db.getUserById('usr_delete_1'), undefined);

    // Batch delete
    const count = db.deleteUsers(['usr_delete_2']);
    assert.equal(count, 1);
    assert.equal(db.getUserById('usr_delete_2'), undefined);
  });

  it('guarantees God-Mode spot editing allows repositioning, tier shifting, and full content mutations', () => {
    const spot: Spot = {
      id: 'sp_god_spot',
      ownerId: 'usr_admin',
      creatorName: 'Spotter',
      slug: 'god-spot',
      tier: 'mini_pop',
      x: 100,
      y: 100,
      width: 170,
      height: 170,
      rotation: 0,
      shape: 'sticky',
      background: '#FFF8E7',
      content: {
        headline: 'Initial Headline',
        text: 'Initial Text',
        textColor: '#000000',
        fontFamily: 'Caveat',
        fontSize: 20,
        alignment: 'center',
        stickers: [],
        frameStyle: 'tape',
      },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 10,
      sharesCount: 0,
    };
    db.addSpot(spot);

    // Admin edits coordinates, rotation, tier, shape, and headline
    const updated = db.updateSpot('sp_god_spot', {
      x: 450,
      y: -220,
      rotation: 4.5,
      tier: 'big_pop',
      shape: 'polaroid',
      background: '#FFFFFF',
      content: {
        ...spot.content,
        headline: 'God-Mode Repositioned Headline',
        imageUrl: 'https://images.unsplash.com/photo-test',
      },
    });

    assert.ok(updated);
    assert.equal(updated.x, 450);
    assert.equal(updated.y, -220);
    assert.equal(updated.rotation, 4.5);
    assert.equal(updated.tier, 'big_pop');
    assert.equal(updated.shape, 'polaroid');
    assert.equal(updated.content.headline, 'God-Mode Repositioned Headline');
    assert.equal(updated.content.imageUrl, 'https://images.unsplash.com/photo-test');
  });

  it('guarantees administrator can edit and delete order records', () => {
    const order: Order = {
      id: 'ord_god_test_1',
      userId: 'usr_admin',
      productId: 'big_pop',
      amountINR: 99,
      currency: 'INR',
      status: 'pending',
      spotDraft: { creatorName: 'Test Creator' },
      createdAt: new Date().toISOString(),
    };
    db.addOrder(order);

    assert.ok(db.getOrderById('ord_god_test_1'));

    // Admin updates order status to paid
    const updated = db.updateOrder('ord_god_test_1', { status: 'paid' });
    assert.ok(updated);
    assert.equal(updated.status, 'paid');

    // Admin deletes order
    const deleted = db.deleteOrder('ord_god_test_1');
    assert.equal(deleted, true);
    assert.equal(db.getOrderById('ord_god_test_1'), undefined);
  });

  it('guarantees administrator can inspect all comments and delete abusive comments', () => {
    const spot: Spot = {
      id: 'sp_cmt_test',
      ownerId: 'usr_admin',
      creatorName: 'Spotter',
      slug: 'cmt-spot',
      tier: 'mini_pop',
      x: 0,
      y: 0,
      width: 170,
      height: 170,
      rotation: 0,
      shape: 'sticky',
      background: '#FFF8E7',
      content: { headline: 'Comment Spot', text: '', textColor: '#000', fontFamily: 'Caveat', fontSize: 20, alignment: 'center', stickers: [], frameStyle: 'tape' },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 0,
      sharesCount: 0,
      commentsCount: 0,
    };
    db.addSpot(spot);

    const cmt1 = db.addComment('sp_cmt_test', { authorName: 'Spammer', text: 'Free crypto scam link!' });
    const cmt2 = db.addComment('sp_cmt_test', { authorName: 'Friend', text: 'Love this pop!' });

    assert.equal(db.getSpotById('sp_cmt_test')?.commentsCount, 2);

    const allComments = db.getAllComments();
    assert.ok(allComments.length >= 2);
    assert.ok(allComments.some(c => c.id === cmt1.id && c.spotTitle === 'Comment Spot'));

    // Admin deletes spam comment
    const deleted = db.deleteComment(cmt1.id);
    assert.equal(deleted, true);
    assert.equal(db.getSpotById('sp_cmt_test')?.commentsCount, 1);
  });

  it('guarantees database snapshot backups list returns array without errors', () => {
    const backups = db.getBackupsList();
    assert.ok(Array.isArray(backups), 'Backups list must be an array');
  });
});
