/**
 * Computer Vision Utilities for Examic ScanStation
 * Implements basic CV algorithms using HTML5 Canvas for real-time video processing.
 * 
 * Pipeline order: α/β (linear) → Grayscale → CV Filter → γ (gamma curve)
 *   α  = gain/brightness multiplier        (α · pixel + β)
 *   β  = bias/offset additive              (0 = neutral)
 *   γ  = gamma correction curve            (pixel^(1/γ))
 *   δ  = adaptive threshold constant       (local mean offset)
 */

// Converts image data to Grayscale
export const applyGrayscale = (imageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminance formula
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  return imageData;
};

// Applies a very fast approximation of Adaptive Thresholding
// Helps eliminate shadows and uneven lighting by comparing each pixel to the average of its local neighborhood.
export const applyAdaptiveThreshold = (imageData, width, height, radius = 7, constant = 5) => {
  const data = imageData.data;
  const grayData = new Uint8ClampedArray(width * height);
  
  // First, get pure grayscale values
  for (let i = 0; i < data.length; i += 4) {
    grayData[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Integral Image for fast local mean computation
  const integral = new Uint32Array(width * height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = 0; x < width; x++) {
      sum += grayData[y * width + x];
      if (y === 0) {
        integral[y * width + x] = sum;
      } else {
        integral[y * width + x] = integral[(y - 1) * width + x] + sum;
      }
    }
  }

  // Apply thresholding based on local mean
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(x - radius, 0);
      const y1 = Math.max(y - radius, 0);
      const x2 = Math.min(x + radius, width - 1);
      const y2 = Math.min(y + radius, height - 1);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      
      let sum = integral[y2 * width + x2];
      if (x1 > 0 && y1 > 0) sum += integral[(y1 - 1) * width + (x1 - 1)];
      if (x1 > 0) sum -= integral[y2 * width + (x1 - 1)];
      if (y1 > 0) sum -= integral[(y1 - 1) * width + x2];

      const mean = sum / count;
      const pixelValue = grayData[y * width + x];

      // If pixel is darker than the local mean minus constant, it's ink (black). Else background (white).
      const finalVal = pixelValue < (mean - constant) ? 0 : 255;
      
      const idx = (y * width + x) * 4;
      data[idx] = data[idx + 1] = data[idx + 2] = finalVal;
      // Alpha remains unchanged
    }
  }
  return imageData;
};

// Applies basic contrast enhancement
export const applyContrast = (imageData, contrast) => {
  const data = imageData.data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
  }
  return imageData;
};

// ─── α · pixel + β  (Linear brightness/bias correction) ────────────────────
// alpha: gain multiplier  (0.5 = dim  →  1.0 = neutral  →  2.0 = bright)
// beta:  additive offset  (-128 = dark offset  →  0 = neutral  →  +128 = lift)
export const applyAlphaBeta = (imageData, alpha = 1.0, beta = 0) => {
  if (alpha === 1.0 && beta === 0) return imageData;
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.min(255, Math.max(0, alpha * data[i]     + beta));
    data[i + 1] = Math.min(255, Math.max(0, alpha * data[i + 1] + beta));
    data[i + 2] = Math.min(255, Math.max(0, alpha * data[i + 2] + beta));
  }
  return imageData;
};

// ─── Gamma Correction  pixel_out = 255 · (pixel_in / 255) ^ (1/γ) ──────────
// gamma < 1.0 → brightens shadows (lifts dark areas)
// gamma > 1.0 → darkens highlights (crushes bright areas)
// gamma = 1.0 → no change
export const applyGammaCorrection = (imageData, gamma = 1.0) => {
  if (gamma === 1.0) return imageData;
  const data = imageData.data;
  // Precompute LUT for speed (256 entries, O(1) per pixel)
  const lut = new Uint8ClampedArray(256);
  const inv = 1.0 / gamma;
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(255 * Math.pow(i / 255, inv));
  }
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
  return imageData;
};

// ─── applyPaperColorizer (Background & Ink Recoloring Styler) ────────────────
export const applyPaperColorizer = (imageData, bgColor, txtColor, tolerance = 60, brightness = 180, inkThresh = 100, inkStrength = 80) => {
  const data = imageData.data;
  const w = imageData.width;
  const h = imageData.height;

  const hexToRgb = (hex) => {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  };

  const [nr, ng, nb] = hexToRgb(bgColor);
  const [tr, tg, tb] = hexToRgb(txtColor);

  // Sample brightest pixels to detect paper background average color
  let rS = 0, gS = 0, bS = 0, cnt = 0;
  const step = Math.max(1, Math.floor((w * h) / 3000));
  for (let i = 0; i < data.length; i += step * 4) {
    const br = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (br > brightness) { rS += data[i]; gS += data[i + 1]; bS += data[i + 2]; cnt++; }
  }
  if (cnt === 0) {
    const mid = (Math.floor(h / 2) * w + Math.floor(w / 2)) * 4;
    rS = data[mid]; gS = data[mid + 1]; bS = data[mid + 2]; cnt = 1;
  }
  const bgR = rS / cnt, bgG = gS / cnt, bgB = bS / cnt;

  for (let i = 0; i < data.length; i += 4) {
    const pr = data[i], pg = data[i + 1], pb = data[i + 2];
    const lum = (pr + pg + pb) / 3;
    const dist = Math.sqrt((pr - bgR) ** 2 + (pg - bgG) ** 2 + (pb - bgB) ** 2);

    if (dist < tolerance && lum > brightness - 50) {
      const t = Math.max(0, Math.min(1, 1 - (dist / tolerance) * 0.3));
      data[i]     = Math.round(pr * (1 - t) + nr * t);
      data[i + 1] = Math.round(pg * (1 - t) + ng * t);
      data[i + 2] = Math.round(pb * (1 - t) + nb * t);
    } else if (lum < inkThresh) {
      const darkness = 1 - lum / inkThresh;
      const blend = darkness * (inkStrength / 100);
      data[i]     = Math.round(pr * (1 - blend) + tr * blend);
      data[i + 1] = Math.round(pg * (1 - blend) + tg * blend);
      data[i + 2] = Math.round(pb * (1 - blend) + tb * blend);
    }
  }
  return imageData;
};


