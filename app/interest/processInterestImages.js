import {
  INTEREST_UPLOAD_LIMITS,
  isHeicFile,
  validateInterestSourceFiles,
  validateProcessedInterestFiles,
} from '../../lib/interestUploadLimits.mjs';

const OUTPUT_TYPE = 'image/jpeg';
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52];

function replaceExtension(name) {
  return `${String(name || 'battle-report').replace(/\.[^.]+$/, '')}.jpg`;
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The browser could not compress this image.'))),
      OUTPUT_TYPE,
      quality,
    );
  });
}

async function decodeFile(file) {
  let source = file;

  if (isHeicFile(file)) {
    try {
      const { default: heic2any } = await import('heic2any');
      const converted = await heic2any({ blob: file, toType: OUTPUT_TYPE, quality: 0.9 });
      source = Array.isArray(converted) ? converted[0] : converted;
    } catch {
      throw new Error(`${file.name} could not be converted from HEIC. Export it as JPG or take a screenshot and try again.`);
    }
  }

  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(source);
    } catch {
      // Safari versions without reliable createImageBitmap support use the
      // object-URL fallback below.
    }
  }

  const objectUrl = URL.createObjectURL(source);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('decode failed'));
      image.src = objectUrl;
    });
  } catch {
    throw new Error(`${file.name} could not be read. Use a valid JPG, PNG, WebP, HEIC, or HEIF image.`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function compressImage(file) {
  const bitmap = await decodeFile(file);
  const scale = Math.min(1, INTEREST_UPLOAD_LIMITS.maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close?.();
    throw new Error('Image compression is unavailable in this browser. Try a current version of Chrome, Safari, or Edge.');
  }
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let blob;
  for (const quality of QUALITY_STEPS) {
    blob = await canvasToBlob(canvas, quality);
    if (blob.size <= INTEREST_UPLOAD_LIMITS.maxProcessedBytes) break;
  }

  return new File([blob], replaceExtension(file.name), {
    type: OUTPUT_TYPE,
    lastModified: file.lastModified,
  });
}

export async function processInterestImages(fileList) {
  const files = Array.from(fileList || []);
  const sourceError = validateInterestSourceFiles(files);
  if (sourceError) throw new Error(sourceError);

  const processed = [];
  for (const file of files) processed.push(await compressImage(file));

  const processedError = validateProcessedInterestFiles(processed);
  if (processedError) throw new Error(processedError);
  return processed;
}
