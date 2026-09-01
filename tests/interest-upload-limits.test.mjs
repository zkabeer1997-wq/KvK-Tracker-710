import assert from 'node:assert/strict';
import test from 'node:test';

import {
  INTEREST_UPLOAD_LIMITS,
  isAcceptedInterestImage,
  isHeicFile,
  validateInterestSourceFiles,
  validateProcessedInterestFiles,
} from '../lib/interestUploadLimits.mjs';

const image = (name, size = 1000, type = 'image/jpeg') => ({ name, size, type });

test('accepts browser HEIC MIME types and extension-only iPhone files', () => {
  assert.equal(isHeicFile(image('photo.heic', 1000, '')), true);
  assert.equal(isHeicFile(image('photo.HEIF', 1000, 'application/octet-stream')), true);
  assert.equal(isAcceptedInterestImage(image('photo.heic', 1000, '')), true);
});

test('rejects unsupported formats and more than four files', () => {
  assert.match(validateInterestSourceFiles([image('report.pdf', 1000, 'application/pdf')]), /not supported/);
  assert.match(
    validateInterestSourceFiles(Array.from({ length: 5 }, (_, index) => image(`report-${index}.jpg`))),
    /no more than 4/,
  );
});

test('rejects source images larger than 12 MB', () => {
  const error = validateInterestSourceFiles([
    image('huge.png', INTEREST_UPLOAD_LIMITS.maxSourceBytes + 1, 'image/png'),
  ]);
  assert.match(error, /larger than 12 MB/);
});

test('enforces compressed per-file and combined request limits', () => {
  assert.match(
    validateProcessedInterestFiles([
      image('large.jpg', INTEREST_UPLOAD_LIMITS.maxProcessedBytes + 1),
    ]),
    /could not be compressed enough/,
  );

  const nearLimit = Math.floor(INTEREST_UPLOAD_LIMITS.maxCombinedBytes / 4) + 1;
  assert.match(
    validateProcessedInterestFiles(Array.from({ length: 4 }, (_, index) => image(`report-${index}.jpg`, nearLimit))),
    /too large together/,
  );
});

test('server-side processed validation rejects unconverted HEIC', () => {
  assert.match(
    validateProcessedInterestFiles([image('report.heic', 1000, 'image/heic')]),
    /could not be converted/,
  );
});
