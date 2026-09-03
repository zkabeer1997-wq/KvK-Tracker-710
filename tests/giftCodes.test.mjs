import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseWikiGiftCodes,
  simulateRedemption,
  summarizeGiftCodeStatusByMember,
  mergeGiftCodeStatusIntoRows,
} from '../lib/giftCodes.mjs';

describe('parseWikiGiftCodes', () => {
  it('extracts bold codes from wiki-like HTML', () => {
    const html = `
      <table>
        <tr><td>Shared</td><td></td><td><b>ACODEBURGER</b></td></tr>
        <tr><td>Expired</td><td></td><td><strong>KSFB200l</strong></td></tr>
      </table>
      NEW CODE: FAMILY25
    `;
    const { codes } = parseWikiGiftCodes(html);
    assert.ok(codes.includes('ACODEBURGER'));
    assert.ok(codes.includes('KSFB200L') || codes.includes('KSFB200l'.toUpperCase()));
    assert.ok(codes.includes('FAMILY25'));
  });

  it('flags unexpected structure', () => {
    const { codes, warning } = parseWikiGiftCodes('<html><body>hello</body></html>');
    assert.equal(codes.length, 0);
    assert.equal(warning, 'unexpected_page_structure');
  });
});

describe('simulateRedemption', () => {
  it('returns a known status shape', () => {
    const r = simulateRedemption('12345', 'TESTCODE');
    assert.ok(['redeemed', 'already_redeemed', 'expired', 'temporary_failure'].includes(r.status));
    assert.ok(typeof r.response === 'string');
  });
});

describe('summarizeGiftCodeStatusByMember', () => {
  const enrollments = [
    { member_id: '106599852', player_id: '106599852', enabled: true },
    { member_id: 'DISABLED_MEMBER', player_id: 'DISABLED_PLAYER', enabled: false },
  ];
  const redemptions = [
    { player_id: '106599852', code: 'NEWEST', status: 'redeemed', created_at: '2026-01-03T00:00:00Z' },
    { player_id: '106599852', code: 'OLDER', status: 'expired', created_at: '2026-01-02T00:00:00Z' },
    { player_id: '106599852', code: 'OLDEST', status: 'pending', created_at: '2026-01-01T00:00:00Z' },
  ];

  it('summarizes counts and picks the newest-first history entry as latest', () => {
    const summaries = summarizeGiftCodeStatusByMember(enrollments, redemptions);
    const mine = summaries.get('106599852');
    assert.equal(mine.enrolled, true);
    assert.equal(mine.enabled, true);
    assert.equal(mine.redeemed, 1);
    assert.equal(mine.pending, 1);
    assert.equal(mine.failed, 1);
    assert.equal(mine.latestStatus, 'redeemed');
    assert.equal(mine.latestCode, 'NEWEST');
  });

  it('reports enrolled members with no redemption history yet', () => {
    const summaries = summarizeGiftCodeStatusByMember(enrollments, []);
    const disabled = summaries.get('DISABLED_MEMBER');
    assert.equal(disabled.enrolled, true);
    assert.equal(disabled.enabled, false);
    assert.equal(disabled.latestStatus, null);
  });
});

describe('mergeGiftCodeStatusIntoRows', () => {
  it('attaches gift_code status to matching rows and a not-enrolled default otherwise', () => {
    const summaries = summarizeGiftCodeStatusByMember(
      [{ member_id: '106599852', player_id: '106599852', enabled: true }],
      [{ player_id: '106599852', code: 'FAMILY25', status: 'redeemed', created_at: '2026-01-01T00:00:00Z' }]
    );
    const rows = mergeGiftCodeStatusIntoRows(
      [{ member_id: '106599852' }, { member_id: 'NOBODY' }],
      summaries
    );
    assert.equal(rows[0].gift_code.enrolled, true);
    assert.equal(rows[0].gift_code.latestCode, 'FAMILY25');
    assert.equal(rows[1].gift_code.enrolled, false);
  });
});
