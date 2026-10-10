/**
 * Browser-side photo compression for uploads (gallery posts, review photos,
 * payment proofs).
 *
 * Uploads leave the device as base64 data URLs and live in MongoDB, so the
 * original camera file is the enemy: a phone photo is 3–9 MB. This downscales
 * to ≤1600 px on the longest side and re-encodes — WebP where the browser can
 * encode it, JPEG everywhere else (including older iPhones) — keeping every
 * upload comfortably under the server's 1.5 MB cap. Photos already small are
 * passed through untouched to avoid needless re-encoding.
 */

// The server rejects data URLs longer than 1.5M characters — stay below it.
const MAX_DATA_URL_CHARS = 1_400_000;
const MAX_DIMENSION = 1600;
// Small enough to send as-is (base64 of 300 KB ≈ 400K chars, far under the cap).
const PASSTHROUGH_BYTES = 300_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });
}

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function decode(file: File): Promise<Decoded> {
  // Honors EXIF orientation where supported, so iPhone photos don't come out
  // rotated after the canvas round-trip.
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as unknown as ImageBitmapOptions);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {
    // Older engines — fall back to a plain <img> decode (orientation best-effort).
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Unsupported image format'));
        el.src = url;
      });
      if (!img.naturalWidth || !img.naturalHeight) throw new Error('Unsupported image format');
      return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  }
}

/**
 * Returns a data URL no larger than `MAX_DATA_URL_CHARS` characters.
 * Throws when the image can't be decoded *and* is too big to send as-is.
 */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  if (file.size <= PASSTHROUGH_BYTES) {
    return readAsDataUrl(file);
  }

  let decoded: Decoded | null = null;
  try {
    decoded = await decode(file);
  } catch {
    // Can't decode (exotic format) — acceptable if it still fits the cap.
    const raw = await readAsDataUrl(file);
    if (raw.length <= MAX_DATA_URL_CHARS) return raw;
    throw new Error('This photo is too large and could not be processed — please choose a smaller image.');
  }

  const { source, width, height, release } = decoded;
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is not available in this browser');
    ctx.drawImage(source, 0, 0, w, h);

    // Quality ladder: first encoding that actually matches the requested type
    // (canvas silently falls back to PNG for unsupported types like WebP on
    // older Safari) AND fits under the cap wins.
    const attempts: Array<[string, number]> = [
      ['image/webp', 0.82],
      ['image/jpeg', 0.82],
      ['image/webp', 0.6],
      ['image/jpeg', 0.6],
    ];
    for (const [type, quality] of attempts) {
      const out = canvas.toDataURL(type, quality);
      if (out.startsWith(`data:${type};`) && out.length <= MAX_DATA_URL_CHARS) return out;
    }
    throw new Error('This photo is too large to process — please choose a smaller image.');
  } finally {
    release();
  }
}
