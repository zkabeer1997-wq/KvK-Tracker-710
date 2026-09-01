export const INTEREST_UPLOAD_LIMITS = Object.freeze({
  maxFiles: 4,
  maxSourceBytes: 12 * 1024 * 1024,
  maxProcessedBytes: 900 * 1024,
  maxCombinedBytes: 3.2 * 1024 * 1024,
  maxDimension: 1920,
});

export const INTEREST_UPLOAD_ACCEPT = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ACCEPTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
const HEIC_EXTENSIONS = new Set(['heic', 'heif']);
const PROCESSED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function fileExtension(name = '') {
  const extension = String(name).split('.').pop()?.toLowerCase();
  return extension === String(name).toLowerCase() ? '' : extension;
}

export function isHeicFile(file) {
  return file?.type === 'image/heic'
    || file?.type === 'image/heif'
    || HEIC_EXTENSIONS.has(fileExtension(file?.name));
}

export function isAcceptedInterestImage(file) {
  return INTEREST_UPLOAD_ACCEPT.includes(file?.type)
    || ACCEPTED_EXTENSIONS.has(fileExtension(file?.name));
}

export function validateInterestSourceFiles(files) {
  if (!files.length) return 'Choose at least one screenshot.';
  if (files.length > INTEREST_UPLOAD_LIMITS.maxFiles) {
    return `Upload no more than ${INTEREST_UPLOAD_LIMITS.maxFiles} screenshots.`;
  }

  const unsupported = files.find((file) => !isAcceptedInterestImage(file));
  if (unsupported) {
    return `${unsupported.name || 'One file'} is not supported. Use JPG, PNG, WebP, HEIC, or HEIF.`;
  }

  const oversized = files.find((file) => file.size > INTEREST_UPLOAD_LIMITS.maxSourceBytes);
  if (oversized) {
    return `${oversized.name || 'One file'} is larger than 12 MB. Choose a smaller screenshot.`;
  }

  return '';
}

export function validateProcessedInterestFiles(files) {
  if (files.some((file) => !PROCESSED_TYPES.has(file.type))) {
    return 'One image could not be converted to a supported upload format.';
  }
  const oversized = files.find((file) => file.size > INTEREST_UPLOAD_LIMITS.maxProcessedBytes);
  if (oversized) return 'One screenshot could not be compressed enough. Crop it slightly and try again.';

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > INTEREST_UPLOAD_LIMITS.maxCombinedBytes) {
    return 'The screenshots are still too large together. Upload fewer images or crop them and try again.';
  }

  return '';
}
