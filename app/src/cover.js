// Vice Cover — canvas cover drawing: panels, colour grade, Anton type, border.
// The title and tagline live inside a safe band above the bottom border so the
// border never clips them: the tagline baseline is pinned to (H - border - pad),
// and the title sits one line above it.
(function (global) {
  'use strict';

  var GRADES = {
    sunset: { top: 'rgba(255,122,24,0.55)', mid: 'rgba(255,46,136,0.35)', bottom: 'rgba(90,20,120,0.55)', glow: '#ff7a18' },
    neon: { top: 'rgba(255,46,136,0.55)', mid: 'rgba(139,92,246,0.35)', bottom: 'rgba(10,180,255,0.5)', glow: '#ff2e88' },
    teal: { top: 'rgba(25,227,194,0.45)', mid: 'rgba(20,140,180,0.3)', bottom: 'rgba(5,60,110,0.55)', glow: '#19e3c2' },
  };

  // Panel rectangles for each layout, as fractions of the canvas.
  function panelsFor(layout, w, h) {
    var gap = 0.008;
    var g = Math.round(Math.min(w, h) * gap);
    if (layout === 'quad') {
      var hw = (w - g) / 2, hh = (h - g) / 2;
      return [
        { x: 0, y: 0, w: hw, h: hh }, { x: hw + g, y: 0, w: hw, h: hh },
        { x: 0, y: hh + g, w: hw, h: hh }, { x: hw + g, y: hh + g, w: hw, h: hh },
      ];
    }
    if (layout === 'duo') {
      var dw = (w - g) / 2;
      return [{ x: 0, y: 0, w: dw, h: h }, { x: dw + g, y: 0, w: dw, h: h }];
    }
    // trio: three vertical panels
    var tw = (w - 2 * g) / 3;
    return [
      { x: 0, y: 0, w: tw, h: h },
      { x: tw + g, y: 0, w: tw, h: h },
      { x: 2 * tw + 2 * g, y: 0, w: tw, h: h },
    ];
  }

  // Draw an image cover-cropped into a rectangle.
  function drawCoverImage(ctx, img, rect) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var scale = Math.max(rect.w / iw, rect.h / ih);
    var dw = iw * scale, dh = ih * scale;
    var dx = rect.x + (rect.w - dw) / 2;
    var dy = rect.y + (rect.h - dh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function applyGrade(ctx, w, h, grade, mix) {
    var g = GRADES[grade] || GRADES.sunset;
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, g.top);
    grad.addColorStop(0.5, g.mid);
    grad.addColorStop(1, g.bottom);
    ctx.save();
    ctx.globalAlpha = mix;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // A soft vignette keeps the panels' edges moody.
    var vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  function fitFont(ctx, text, maxWidth, startPx, family) {
    var px = startPx;
    ctx.font = px + 'px ' + family;
    while (px > 24 && ctx.measureText(text).width > maxWidth) {
      px -= 4;
      ctx.font = px + 'px ' + family;
    }
    return px;
  }

  function drawText(ctx, state, w, h, border) {
    var family = 'Anton, "Arial Black", sans-serif';
    var pad = Math.round(h * 0.035); // gap between the text band and the border
    var safeW = w - 2 * (border + pad);
    var cx = w / 2;
    // Tagline baseline is pinned inside the canvas: bottom border + pad above it.
    var tagBaseline = h - border - pad;
    var tagPx = Math.round(h * 0.038);
    var tagline = (state.tagline || '').toUpperCase();
    var caption = (state.caption || '').toUpperCase();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = Math.round(h * 0.012);
    ctx.shadowOffsetY = Math.round(h * 0.004);

    if (tagline) {
      var tpx = fitFont(ctx, tagline, safeW, tagPx, family);
      ctx.font = tpx + 'px ' + family;
      ctx.lineWidth = Math.max(2, Math.round(tpx * 0.08));
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeText(tagline, cx, tagBaseline);
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(tagline, cx, tagBaseline);
    }

    if (caption) {
      // Title sits above the tagline: one title line + a gap, still inside the safe band.
      var titlePx = fitFont(ctx, caption, safeW, Math.round(h * 0.115), family);
      var titleBaseline = tagBaseline - (tagline ? tagPx + Math.round(h * 0.02) : 0) - Math.round(h * 0.012);
      ctx.font = titlePx + 'px ' + family;
      ctx.lineWidth = Math.max(3, Math.round(titlePx * 0.09));
      ctx.strokeStyle = 'rgba(20,0,40,0.85)';
      ctx.strokeText(caption, cx, titleBaseline);
      var grad = ctx.createLinearGradient(0, titleBaseline - titlePx, 0, titleBaseline);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.55, '#ffd166');
      grad.addColorStop(1, '#ff7a18');
      ctx.fillStyle = grad;
      ctx.fillText(caption, cx, titleBaseline);
    }
    ctx.restore();
  }

  // Draw the whole cover. images: { photo: HTMLImageElement, photo2: HTMLImageElement }.
  function drawCover(canvas, state, images) {
    var size = global.ViceState.sizeOf(state);
    var w = size.w, h = size.h;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d0714';
    ctx.fillRect(0, 0, w, h);

    var panels = panelsFor(state.layout, w, h);
    var photos = [images.photo, images.photo2];
    panels.forEach(function (rect, i) {
      var img = photos[i % photos.length];
      if (img) drawCoverImage(ctx, img, rect);
    });

    applyGrade(ctx, w, h, state.grade, state.mix);

    // Panel divider lines.
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.004));
    panels.forEach(function (rect) {
      ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    });
    ctx.restore();

    drawText(ctx, state, w, h, Math.round(Math.min(w, h) * 0.016));

    // Outer border, drawn last so it frames everything.
    var border = Math.round(Math.min(w, h) * 0.016);
    ctx.save();
    ctx.strokeStyle = (GRADES[state.grade] || GRADES.sunset).glow;
    ctx.lineWidth = border;
    ctx.strokeRect(border / 2, border / 2, w - border, h - border);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(1, Math.round(border / 4));
    ctx.strokeRect(border + 2, border + 2, w - 2 * border - 4, h - 2 * border - 4);
    ctx.restore();
  }

  global.ViceCover = { drawCover: drawCover, panelsFor: panelsFor, grades: Object.keys(GRADES) };
})(typeof window !== 'undefined' ? window : globalThis);
