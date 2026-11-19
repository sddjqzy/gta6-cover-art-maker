// Draws the Vice Cover: the chosen photos laid into panels, a colour grade
// washed over them, and the caption in big Anton capitals with the tagline
// beneath, all on the canvas at its own pixel size.
//
// The canvas is the cover itself: main.js sizes it to the state's export size
// (1080 x 1080, 1024 x 1280 or 1280 x 720) and this module fills it.

import { coverSize, panelPhotos } from './state.js';

/** The three grades: a wash colour, a sunset gradient and a sky tint. */
export const GRADES = {
  sunset: { wash: 'rgba(255, 122, 26, 0.20)', deep: 'rgba(214, 48, 120, 0.55)', sky: 'rgba(255, 190, 80, 0.28)', accent: '#ffb347' },
  neon: { wash: 'rgba(0, 229, 255, 0.16)', deep: 'rgba(150, 40, 255, 0.55)', sky: 'rgba(255, 45, 149, 0.30)', accent: '#2de2ff' },
  teal: { wash: 'rgba(0, 200, 170, 0.18)', deep: 'rgba(0, 90, 110, 0.55)', sky: 'rgba(120, 255, 210, 0.26)', accent: '#5cf2c8' },
};

/**
 * Panel rectangles for each layout, as fractions of the cover.
 * trio: one tall panel left, two stacked panels right.
 * quad: a 2 x 2 grid. duo: two panels side by side.
 */
export function panelRects(layout, width, height) {
  if (layout === 'quad') {
    return [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ].map(([x, y, w, h]) => [x * width, y * height, w * width, h * height]);
  }
  if (layout === 'duo') {
    return [
      [0, 0, 0.5, 1],
      [0.5, 0, 0.5, 1],
    ].map(([x, y, w, h]) => [x * width, y * height, w * width, h * height]);
  }
  return [
    [0, 0, 0.58, 1],
    [0.58, 0, 0.42, 0.5],
    [0.58, 0.5, 0.42, 0.5],
  ].map(([x, y, w, h]) => [x * width, y * height, w * width, h * height]);
}

/** Draw `img` into a rectangle, cropped to fill it like a poster panel. */
function drawPanelPhoto(ctx, img, x, y, w, h, index) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const pw = iw * scale;
  const ph = ih * scale;
  // Nudge alternate panels so the same photo reads differently in each one.
  const dx = index % 2 === 0 ? (w - pw) / 2 : (w - pw) * 0.65;
  const dy = index % 2 === 0 ? (h - ph) / 2 : (h - ph) * 0.35;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + dx, y + dy, pw, ph);
  ctx.restore();
}

/** Shrink `text` until it fits `maxWidth`, then return the font string. */
function fitFont(ctx, text, startSize, maxWidth, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

/**
 * Draw the whole cover onto `canvas` from the state and a map of photo key to
 * loaded image. Missing images leave their panels as flat colour.
 */
export function drawCover(canvas, current, images) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[current.grade] ?? GRADES.sunset;
  const size = coverSize(current);
  void size;

  ctx.fillStyle = '#160a1e';
  ctx.fillRect(0, 0, w, h);

  const gutter = Math.max(4, Math.round(w * 0.006));
  const rects = panelRects(current.layout, w, h);
  const keys = panelPhotos(current);
  rects.forEach(([x, y, pw, ph], i) => {
    const insetX = x + (i === 0 || current.layout === 'quad' ? gutter : 0);
    const insetY = y + (i === 0 || current.layout === 'trio' ? gutter : 0);
    const insetW = pw - gutter * (current.layout === 'duo' ? 1 : 1.5);
    const insetH = ph - gutter * (current.layout === 'quad' ? 1.5 : 1);
    drawPanelPhoto(ctx, images.get(keys[i]), insetX, insetY, Math.max(insetW, 1), Math.max(insetH, 1), i);
  });

  // The grade: a warm wash over everything, a deep gradient rising from the
  // foot where the lettering sits, and a bright sky tint across the top.
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.32);
  sky.addColorStop(0, grade.sky);
  sky.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.32);
  const foot = ctx.createLinearGradient(0, h * 0.45, 0, h);
  foot.addColorStop(0, 'rgba(10, 4, 18, 0)');
  foot.addColorStop(1, grade.deep);
  ctx.fillStyle = foot;
  ctx.fillRect(0, h * 0.45, w, h * 0.55);

  // Lettering: the caption in huge Anton capitals, outlined and shadowed,
  // with the tagline in a small tracked-out line beneath it.
  const caption = (current.caption || '').trim().toUpperCase();
  const tagline = (current.tagline || '').trim();
  const family = 'Anton, "Arial Narrow", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (caption) {
    const sizePx = fitFont(ctx, caption, h * 0.115, w * 0.92, family);
    const baseline = h - h * 0.10;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, sizePx * 0.09);
    ctx.strokeStyle = 'rgba(12, 4, 20, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = sizePx * 0.18;
    ctx.shadowOffsetY = sizePx * 0.04;
    ctx.strokeText(caption, w / 2, baseline);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(caption, w / 2, baseline);
    // A thin accent rule above the caption, in the grade's accent colour.
    const ruleW = ctx.measureText(caption).width;
    ctx.fillStyle = grade.accent;
    ctx.fillRect((w - ruleW) / 2, baseline - sizePx * 1.28, ruleW, Math.max(3, h * 0.006));
  }
  if (tagline) {
    const tagSize = Math.max(14, Math.round(h * 0.026));
    ctx.font = `600 ${tagSize}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = tagSize * 0.3;
    ctx.fillText(tagline.toUpperCase(), w / 2, h - h * 0.045);
    ctx.shadowBlur = 0;
  }

  // The frame: a white outer border and a thin inner line, poster style.
  const edge = Math.max(5, Math.round(w * 0.008));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = edge;
  ctx.strokeRect(edge / 2, edge / 2, w - edge, h - edge);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = Math.max(1, edge * 0.18);
  ctx.strokeRect(edge * 2.2, edge * 2.2, w - edge * 4.4, h - edge * 4.4);
}
