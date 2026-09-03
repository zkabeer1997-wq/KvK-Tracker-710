import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseWikiGiftCodes, simulateRedemption } from '../lib/giftCodes.mjs';

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
