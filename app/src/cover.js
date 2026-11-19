// Vice Cover — canvas cover renderer.
// Draws the multi-panel GTA 6 style cover: photo panels, a colour grade
// wash, a big Anton title, a tagline and a frame. Pure canvas 2D, no
// dependencies, so the editor preview and the exported PNG share one path.

const GRADES = {
  sunset: {
    // Warm dusk: amber high, magenta low.
    stops: [
      [0, 'rgba(255, 122, 26, 0.55)'],
      [0.55, 'rgba(255, 46, 136, 0.28)'],
      [1, 'rgba(64, 12, 64, 0.45)'],
    ],
  },
  neon: {
    // Hot pink against electric cyan.
    stops: [
      [0, 'rgba(255, 46, 136, 0.55)'],
      [0.5, 'rgba(124, 58, 237, 0.30)'],
      [1, 'rgba(0, 229, 255, 0.45)'],
    ],
  },
  teal: {
    // Cool lagoon green-blue.
    stops: [
      [0, 'rgba(0, 229, 255, 0.45)'],
      [0.55, 'rgba(0, 180, 160, 0.30)'],
      [1, 'rgba(4, 48, 64, 0.50)'],
    ],
  },
};

/** Load an image; resolves with the element, rejects on error. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load image: ${src}`));
    img.src = src;
    if (img.complete && img.naturalWidth > 0) resolve(img);
  });
}

/** Panel rectangles for a layout, inside the frame. Returns {x, y, w, h} list. */
function panelRects(layout, x, y, w, h, gap) {
  if (layout === 'duo') {
    const pw = (w - gap) / 2;
    return [
      { x, y, w: pw, h },
      { x: x + pw + gap, y, w: pw, h },
    ];
  }
  if (layout === 'quad') {
    const pw = (w - gap) / 2;
    const ph = (h - gap) / 2;
    return [
      { x, y, w: pw, h: ph },
      { x: x + pw + gap, y, w: pw, h: ph },
      { x, y: y + ph + gap, w: pw, h: ph },
      { x: x + pw + gap, y: y + ph + gap, w: pw, h: ph },
    ];
  }
  // trio: three upright panels.
  const pw = (w - gap * 2) / 3;
  return [
    { x, y, w: pw, h },
    { x: x + pw + gap, y, w: pw, h },
    { x: x + (pw + gap) * 2, y, w: pw, h },
  ];
}

/** Draw an image cropped to cover a rectangle (no stretching). */
function drawCoverImage(ctx, img, rect) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2;
  const dy = rect.y + (rect.h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Wrap a line of text to fit a width; returns the lines. */
function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draw the cover onto `canvas` at the state's size.
 * `photos` is { photo1, photo2 } of loaded HTMLImageElements.
 */
export function drawCover(canvas, state, photos) {
  const { width, height } = state.size === 'square'
    ? { width: 1080, height: 1080 }
    : state.size === 'portrait'
      ? { width: 1024, height: 1280 }
      : { width: 1280, height: 720 };
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  const frame = Math.round(width * 0.022); // outer frame thickness
  const gap = Math.round(width * 0.011);
  const pad = frame + gap;

  // Backdrop.
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, width, height);

  // Photo panels. Trio alternates photo1 / photo2 / photo1; quad mirrors
  // them; duo shows one each.
  const pics = [photos.photo1, photos.photo2, photos.photo1, photos.photo2];
  const rects = panelRects(state.layout, pad, pad, width - pad * 2, height - pad * 2, gap);
  rects.forEach((rect, i) => {
    const img = pics[i % pics.length];
    if (!img) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    drawCoverImage(ctx, img, rect);
    ctx.restore();
  });

  // Colour grade wash over the panels only.
  const grade = GRADES[state.grade] || GRADES.sunset;
  const strength = (state.mix / 100) * 0.85;
  if (strength > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad, pad, width - pad * 2, height - pad * 2);
    ctx.clip();
    const wash = ctx.createLinearGradient(pad, pad, width - pad, height - pad);
    for (const [stop, color] of grade.stops) wash.addColorStop(stop, color);
    ctx.globalAlpha = strength;
    ctx.fillStyle = wash;
    ctx.fillRect(pad, pad, width - pad * 2, height - pad * 2);
    ctx.restore();
  }

  // Gentle vignette so the title sits on a readable patch.
  const shade = ctx.createLinearGradient(0, height * 0.55, 0, height - pad);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
  ctx.fillStyle = shade;
  ctx.fillRect(pad, height * 0.55, width - pad * 2, height - pad - height * 0.55);

  // Title + tagline, bottom left, Anton, white with a black edge.
  const textX = pad + Math.round(width * 0.035);
  const maxTextW = width - pad * 2 - Math.round(width * 0.07);
  const titleSize = Math.round(width * (state.layout === 'duo' ? 0.085 : 0.105));
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.round(width * 0.012);
  ctx.shadowOffsetY = Math.round(width * 0.004);

  ctx.font = `${titleSize}px Anton, "Arial Black", sans-serif`;
  const caption = (state.caption || 'VICE CITY').toUpperCase();
  const titleLines = wrapText(ctx, caption, maxTextW).slice(0, 2);
  const tagSize = Math.round(width * 0.032);
  const lineGap = Math.round(titleSize * 0.18);
  const tagGap = Math.round(tagSize * 0.6);
  // Bottom-up: the tagline baseline sits just inside the panel bottom, the
  // title stacks above it, so nothing ever runs past the frame.
  const tagBaseline = height - pad - Math.round(height * 0.02);
  const titleLastBaseline = tagBaseline - tagSize - tagGap;
  titleLines.forEach((line, i) => {
    const ty = titleLastBaseline - (titleLines.length - 1 - i) * (titleSize + lineGap);
    ctx.lineWidth = Math.max(3, Math.round(titleSize * 0.09));
    ctx.strokeText(line, textX, ty);
    ctx.fillText(line, textX, ty);
  });
  ctx.font = `${tagSize}px Anton, "Arial Black", sans-serif`;
  ctx.lineWidth = Math.max(2, Math.round(tagSize * 0.08));
  ctx.shadowBlur = Math.round(width * 0.008);
  const tagline = state.tagline || '';
  if (tagline) {
    const tagLines = wrapText(ctx, tagline, maxTextW).slice(0, 2);
    tagLines.forEach((line, i) => {
      const ty = tagBaseline - (tagLines.length - 1 - i) * (tagSize + Math.round(tagSize * 0.35));
      ctx.strokeText(line, textX, ty);
      ctx.fillText(line, textX, ty);
    });
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Frame: white outer edge, thin inner line.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = frame;
  ctx.strokeRect(frame / 2, frame / 2, width - frame, height - frame);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = Math.max(2, Math.round(width * 0.002));
  ctx.strokeRect(pad - gap / 2, pad - gap / 2, width - (pad - gap / 2) * 2, height - (pad - gap / 2) * 2);

  return canvas;
}
