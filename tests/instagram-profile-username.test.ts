import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateInstagramUsername } from '../src/utils/instagramUsername.ts';

describe('Instagram Username Validation & Profile Management Engine', () => {
  // Test 1: Valid usernames
  test('Valid Instagram usernames pass validation and normalize cleanly', () => {
    const validCases = [
      'chatdora.in',
      'alex_chen',
      'rohit.sharma',
      'vivek_99',
      'user.123_abc',
      'a.b_c',
      '@chatdora.in', // leading @ is stripped
      'CHATDORA.IN', // normalized to lowercase
    ];

    for (const input of validCases) {
      const res = validateInstagramUsername(input);
      assert.equal(res.isValid, true, `Expected "${input}" to be valid`);
      assert.equal(res.cleanUsername, input.replace(/^@/, '').toLowerCase());
    }
  });

  // Test 2: Starting with period is rejected
  test('Username starting with a period is rejected per Instagram rules', () => {
    const res = validateInstagramUsername('.chatdora');
    assert.equal(res.isValid, false);
    assert.match(res.error || '', /cannot begin with a period/i);
  });

  // Test 3: Ending with period is rejected
  test('Username ending with a period is rejected per Instagram rules', () => {
    const res = validateInstagramUsername('chatdora.');
    assert.equal(res.isValid, false);
    assert.match(res.error || '', /cannot end with a period/i);
  });

  // Test 4: Consecutive periods are rejected
  test('Username containing consecutive periods (..) is rejected', () => {
    const res = validateInstagramUsername('chat..dora');
    assert.equal(res.isValid, false);
    assert.match(res.error || '', /consecutive periods/i);
  });

  // Test 5: Invalid symbols and spaces are rejected
  test('Username with spaces, hyphens, or special symbols is rejected', () => {
    const invalidCases = [
      'chat dora',
      'chat-dora',
      'chat!dora',
      'chat#dora',
      'chat$dora',
      'chat%dora',
      'chat*dora',
    ];

    for (const input of invalidCases) {
      const res = validateInstagramUsername(input);
      assert.equal(res.isValid, false, `Expected "${input}" to be rejected`);
      assert.match(res.error || '', /only use letters, numbers, underscores and periods/i);
    }
  });

  // Test 6: Length boundaries
  test('Username length limits: minimum 3 and maximum 30 characters', () => {
    const tooShort = validateInstagramUsername('ab');
    assert.equal(tooShort.isValid, false);
    assert.match(tooShort.error || '', /at least 3 characters/i);

    const tooLong = validateInstagramUsername('a'.repeat(31));
    assert.equal(tooLong.isValid, false);
    assert.match(tooLong.error || '', /30 characters or fewer/i);

    const exact3 = validateInstagramUsername('abc');
    assert.equal(exact3.isValid, true);

    const exact30 = validateInstagramUsername('a'.repeat(30));
    assert.equal(exact30.isValid, true);
  });

  // Test 7: Reserved keywords
  test('System reserved words cannot be claimed as usernames', () => {
    const reservedWords = ['admin', 'api', 'spots', 'creators', 'reels', 'explore', 'spotpop'];
    for (const word of reservedWords) {
      const res = validateInstagramUsername(word);
      assert.equal(res.isValid, false, `Expected reserved word "${word}" to be rejected`);
      assert.match(res.error || '', /reserved|unavailable|isn't available/i);
    }
  });

  // Test 8: Uniqueness simulation
  test('Uniqueness check detects taken usernames and allows current user username', () => {
    const registeredUsers = [
      { id: 'usr_1', username: 'mira_c' },
      { id: 'usr_2', username: 'chatdora.in' },
    ];

    const checkAvailability = (candidate: string, currentUserId?: string) => {
      const val = validateInstagramUsername(candidate);
      if (!val.isValid) return { available: false, error: val.error };

      const existing = registeredUsers.find(u => u.username.toLowerCase() === val.cleanUsername.toLowerCase());
      if (existing) {
        if (currentUserId && existing.id === currentUserId) {
          return { available: true, isCurrent: true, cleanUsername: val.cleanUsername };
        }
        return { available: false, error: `The username '@${val.cleanUsername}' isn't available.` };
      }
      return { available: true, cleanUsername: val.cleanUsername };
    };

    // Candidate taken by another user
    const resTaken = checkAvailability('mira_c', 'usr_2');
    assert.equal(resTaken.available, false);
    assert.match(resTaken.error || '', /isn't available/i);

    // Current user keeping their own username
    const resSelf = checkAvailability('chatdora.in', 'usr_2');
    assert.equal(resSelf.available, true);
    assert.equal((resSelf as any).isCurrent, true);

    // Available new username
    const resNew = checkAvailability('brand.new_user', 'usr_2');
    assert.equal(resNew.available, true);
  });
});
