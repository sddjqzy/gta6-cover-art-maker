// Vice Cover: the renderer. One function, renderCover, paints a whole cover
// onto any 2D canvas context at any size, from the state and the loaded
// photos. The editor preview and the exported PNG both call it, so what you
// see is what you share. All decoration is drawn with canvas paths — a sun,
// a skyline, palm silhouettes and grain — nothing is copied from any game.

import { GRADES, captionRect, panelRects } from './state.js';

/** Draws `photo` cover-fitting `rect`, shifted by the panel's crop. */
export function drawPanelPhoto(ctx, photo, rect, crop) {
  if (!photo) return;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const zoom = Math.max(0.5, crop.zoom || 1);
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // crop.x / crop.y run -1..1 and slide the photo inside its panel.
  const dx = rect.x + (rect.w - dw) / 2 + (crop.x || 0) * (dw - rect.w) / 2;
  const dy = rect.y + (rect.h - dh) / 2 + (crop.y || 0) * (dh - rect.h) / 2;
  ctx.drawImage(photo, dx, dy, dw, dh);
}

/** A palm silhouette: a leaning trunk and seven drooping fronds. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.55, x + s * 0.22, y - s * 0.95);
  ctx.stroke();
  const topX = x + s * 0.22;
  const topY = y - s * 0.95;
  for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 38) * Math.PI / 180;
    const len = s * (0.42 + (i % 2) * 0.1);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + s * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.5,
      topY + Math.sin(a) * len * 0.35 - s * 0.08,
      ex, ey,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** A low skyline silhouette along the bottom of a rectangle. */
export function drawSkyline(ctx, rect, color) {
  ctx.save();
  ctx.fillStyle = color;
  const base = rect.y + rect.h;
  let x = rect.x;
  let seed = 7;
  while (x < rect.x + rect.w) {
    seed = (seed * 37 + 11) % 97;
    const bw = rect.w * (0.05 + (seed % 5) * 0.012);
    const bh = rect.h * (0.18 + (seed % 7) * 0.05);
    ctx.fillRect(x, base - bh, bw, bh);
    if (seed % 3 === 0) ctx.fillRect(x + bw * 0.3, base - bh - rect.h * 0.12, bw * 0.12, rect.h * 0.12);
    x += bw + rect.w * 0.008;
  }
  ctx.restore();
}

/** Deterministic specks of grain so flat colour never looks banded. */
export function drawGrain(ctx, width, height, amount) {
  ctx.save();
  let seed = 1234567;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < amount; i++) {
    const v = next();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(next() * width, next() * height, 2, 2);
  }
  ctx.restore();
}

/** Fits the title font size so the words span the caption band. */
export function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  while (size > 24 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  }
  return size;
}

/**
 * Paints the full cover. `state` is the editor state, `photos` the loaded
 * images (index 0 is the first photo). Works at any canvas size.
 */
export function renderCover(ctx, state, photos, width, height) {
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const gap = Math.max(6, Math.round(width * 0.008));
  const rects = panelRects(state.layout, width, height);
  const band = captionRect(state.layout, width, height);

  // Backdrop: the white poster board the panels sit on.
  ctx.fillStyle = '#fdf8f2';
  ctx.fillRect(0, 0, width, height);

  // Photos, each clipped to its panel with a white frame around it.
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, x: 0, y: 0, zoom: 1 };
    const photoIndex = state.onePhotoEverywhere ? 0 : panel.photo;
    const photo = photos[photoIndex] || photos[0] || null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x + gap / 2, rect.y + gap / 2, rect.w - gap, rect.h - gap);
    ctx.clip();
    if (photo) {
      drawPanelPhoto(ctx, photo, { x: rect.x + gap / 2, y: rect.y + gap / 2, w: rect.w - gap, h: rect.h - gap }, panel);
    } else {
      const sky = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
      sky.addColorStop(0, grade.sky[1]);
      sky.addColorStop(1, grade.sky[2]);
      ctx.fillStyle = sky;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    // The grade: a warm wash from the top, a cool wash from the bottom.
    const warm = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h * 0.6);
    warm.addColorStop(0, grade.washWarm);
    warm.addColorStop(1, 'rgba(255,110,60,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const cool = ctx.createLinearGradient(0, rect.y + rect.h * 0.4, 0, rect.y + rect.h);
    cool.addColorStop(0, 'rgba(120,40,160,0)');
    cool.addColorStop(1, grade.washCool);
    ctx.fillStyle = cool;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    // Thin dark keyline around the panel, poster style.
    ctx.strokeStyle = 'rgba(20,8,32,0.85)';
    ctx.lineWidth = Math.max(2, gap * 0.45);
    ctx.strokeRect(rect.x + gap / 2, rect.y + gap / 2, rect.w - gap, rect.h - gap);
  });

  // Caption band: a sunset sky, a low sun, a skyline and two palms.
  const sky = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  grade.sky.forEach((color, i) => sky.addColorStop(i / (grade.sky.length - 1), color));
  ctx.fillStyle = sky;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  const sunR = band.h * 0.42;
  const sunX = band.x + band.w * 0.82;
  const sunY = band.y + band.h * 0.52;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.2);
  glow.addColorStop(0, grade.sun + 'cc');
  glow.addColorStop(1, grade.sun + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Retro sun slats cut across the disc.
  ctx.fillStyle = sky;
  ctx.fillRect(sunX - sunR, sunY + sunR * 0.1, sunR * 2, sunR * 0.08);
  ctx.fillRect(sunX - sunR, sunY + sunR * 0.35, sunR * 2, sunR * 0.1);
  ctx.fillRect(sunX - sunR, sunY + sunR * 0.62, sunR * 2, sunR * 0.12);
  drawSkyline(ctx, { x: band.x, y: band.y + band.h * 0.78, w: band.w, h: band.h * 0.22 }, 'rgba(24,6,40,0.55)');
  drawPalm(ctx, band.x + band.w * 0.045, band.y + band.h * 0.98, band.h * 0.85, 'rgba(24,6,40,0.75)');
  drawPalm(ctx, band.x + band.w * 0.95, band.y + band.h * 0.98, band.h * 0.7, 'rgba(24,6,40,0.6)');

  // Title lettering, fitted to the band.
  const title = (state.title || '').trim().toUpperCase();
  const tagline = (state.tagline || '').trim().toUpperCase();
  const cx = band.x + band.w / 2;
  if (title) {
    const maxWidth = band.w * 0.86;
    const size = fitTitleFont(ctx, title, maxWidth, band.h * 0.52);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${Math.max(2, size * 0.02)}px`; } catch { /* older canvas */ }
    const titleY = band.y + band.h * (tagline ? 0.38 : 0.5);
    if (state.lettering === 'outline') {
      ctx.lineWidth = Math.max(2, size * 0.045);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(title, cx, titleY);
    } else {
      if (state.lettering === 'gradient') {
        const fill = ctx.createLinearGradient(cx - maxWidth / 2, titleY, cx + maxWidth / 2, titleY);
        grade.title.forEach((color, i) => fill.addColorStop(i / (grade.title.length - 1), color));
        ctx.fillStyle = fill;
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.shadowColor = 'rgba(20,4,36,0.65)';
      ctx.shadowBlur = size * 0.18;
      ctx.shadowOffsetY = size * 0.04;
      ctx.fillText(title, cx, titleY);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      // A dark keyline keeps white lettering readable over the sun.
      ctx.lineWidth = Math.max(1.5, size * 0.02);
      ctx.strokeStyle = 'rgba(20,4,36,0.55)';
      ctx.strokeText(title, cx, titleY);
    }
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  if (tagline) {
    const tagSize = Math.max(14, band.h * 0.13);
    ctx.font = `700 ${tagSize}px 'Liberation Sans', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${tagSize * 0.32}px`; } catch { /* older canvas */ }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(tagline, cx, band.y + band.h * 0.82);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }

  // Vignette and grain over the whole cover.
  const vig = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,2,24,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
  drawGrain(ctx, width, height, Math.round(width * height / 900));
}
