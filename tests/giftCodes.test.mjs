import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseWikiGiftCodes,
  summarizeGiftCodeStatusByMember,
  mergeGiftCodeStatusIntoRows,
} from '../lib/giftCodes.mjs';

// A trimmed but structurally verbatim sample of kingshotwiki.com/giftcodes/,
// as captured 2026-09-03.
const REAL_WIKI_HTML = `
<div style="font-family: Arial, Tahoma, sans-serif;">
<strong>Hello, Governors!</strong><br>
We'll keep this page updated with any new codes.<strong>Active Codes:</strong><p></p>
<ul>
<li><span class="code">Kingshot888</span><button class="copy-btn">Copy</button></li>
<li><span class="code">VIP777</span><button class="copy-btn">Copy</button></li>
</ul>
<p><strong><strong class="svelte-x57wqa"><span class="svelte-x57wqa fade-in">Concierge</span></strong><span class="svelte-x57wqa fade-in"> member codes:</span></strong></p>
<ul>
<li></li>
</ul>
</div>
`;

describe('parseWikiGiftCodes', () => {
  it('extracts active codes from the real kingshotwiki.com markup, preserving case', () => {
    const { codes, warning } = parseWikiGiftCodes(REAL_WIKI_HTML);
    assert.equal(warning, undefined);
    assert.deepEqual(codes, ['Kingshot888', 'VIP777']);
    // Case must survive exactly - the redemption spec requires original spelling.
    assert.ok(!codes.includes('KINGSHOT888'));
  });

  it('does not pick up codes from the Concierge (VIP-only) section', () => {
    const html = REAL_WIKI_HTML.replace(
      '<li></li>',
      '<li><span class="code">VIPONLYCODE</span></li>'
    );
    const { codes } = parseWikiGiftCodes(html);
    assert.ok(!codes.includes('VIPONLYCODE'));
  });

  it('flags unexpected structure when there is no Active Codes heading', () => {
    const { codes, warning } = parseWikiGiftCodes('<html><body>hello</body></html>');
    assert.equal(codes.length, 0);
    assert.equal(warning, 'unexpected_page_structure');
  });

  it('flags unexpected structure when the heading exists but no codes parse out', () => {
    const html = '<strong>Active Codes:</strong><ul><li>no span here</li></ul>';
    const { codes, warning } = parseWikiGiftCodes(html);
    assert.equal(codes.length, 0);
    assert.equal(warning, 'unexpected_page_structure');
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
