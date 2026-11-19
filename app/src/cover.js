// Vice Cover drawing engine: paints the multi-panel cover onto a canvas.
//
// Layouts: trio (three columns), quad (2x2 grid), duo (two columns).
// Grades: sunset (warm dusk), neon (pink/cyan), teal (ocean green).
// The big title and tagline are set in the bundled Anton font.
(function (global) {
  'use strict';

  var GRADES = {
    sunset: { from: '#ff7a18', to: '#ff2e88', wash: '#ffb347', name: 'Sunset' },
    neon: { from: '#ff2e88', to: '#2ee6ff', wash: '#b967ff', name: 'Neon' },
    teal: { from: '#00c2a8', to: '#2e7dff', wash: '#7dffd4', name: 'Teal' },
  };

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('could not load image: ' + src)); };
      img.src = src;
    });
  }

  // Draw an image so it covers a rect (centre-cropped), like CSS object-fit: cover.
  function drawCoverFit(ctx, img, x, y, w, h) {
    var scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var dw = img.naturalWidth * scale;
    var dh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function panelsFor(layout, width, height, gutter) {
    if (layout === 'quad') {
      var cw = (width - gutter * 3) / 2;
      var ch = (height - gutter * 3) / 2;
      return [
        { x: gutter, y: gutter, w: cw, h: ch },
        { x: gutter * 2 + cw, y: gutter, w: cw, h: ch },
        { x: gutter, y: gutter * 2 + ch, w: cw, h: ch },
        { x: gutter * 2 + cw, y: gutter * 2 + ch, w: cw, h: ch },
      ];
    }
    var count = layout === 'duo' ? 2 : 3;
    var pw = (width - gutter * (count + 1)) / count;
    var panels = [];
    for (var i = 0; i < count; i++) {
      panels.push({ x: gutter + i * (pw + gutter), y: gutter, w: pw, h: height - gutter * 2 });
    }
    return panels;
  }

  function applyGrade(ctx, width, height, gradeName, mix) {
    var grade = GRADES[gradeName] || GRADES.sunset;
    var grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, grade.from);
    grad.addColorStop(1, grade.to);
    ctx.save();
    ctx.globalAlpha = 0.28 + 0.5 * mix;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.25 * mix;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = grade.wash;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    // Vignette: darken the edges so the white frame and title pop.
    var vig = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.35,
      width / 2, height / 2, Math.max(width, height) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  function fitFont(ctx, text, maxWidth, startPx, family) {
    var px = startPx;
    ctx.font = px + 'px ' + family;
    while (px > 24 && ctx.measureText(text).width > maxWidth) {
      px -= 2;
      ctx.font = px + 'px ' + family;
    }
    return px;
  }

  function drawTitleBlock(ctx, width, height, caption, tagline) {
    var margin = Math.round(width * 0.055);
    var maxWidth = width - margin * 2;
    // Dark legibility band across the lower third.
    var bandTop = height * 0.62;
    var band = ctx.createLinearGradient(0, bandTop, 0, height);
    band.addColorStop(0, 'rgba(5,2,12,0)');
    band.addColorStop(0.45, 'rgba(5,2,12,0.55)');
    band.addColorStop(1, 'rgba(5,2,12,0.82)');
    ctx.fillStyle = band;
    ctx.fillRect(0, bandTop, width, height - bandTop);

    var title = (caption || 'VICE CITY').toUpperCase();
    var titlePx = fitFont(ctx, title, maxWidth, Math.round(width * 0.115), "Anton, 'Arial Narrow', sans-serif");
    var titleY = height - Math.round(height * 0.115);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(255,46,136,0.65)';
    ctx.shadowBlur = Math.round(width * 0.02);
    ctx.shadowOffsetY = 3;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,4,20,0.9)';
    ctx.lineWidth = Math.max(4, Math.round(titlePx * 0.09));
    ctx.strokeText(title, width / 2, titleY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, width / 2, titleY);
    ctx.restore();

    var tag = (tagline || '').toUpperCase();
    if (tag) {
      var tagPx = fitFont(ctx, tag, maxWidth, Math.round(width * 0.032), "Anton, 'Arial Narrow', sans-serif");
      var tagY = titleY + Math.round(height * 0.052);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = tagPx + "px Anton, 'Arial Narrow', sans-serif";
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(10,4,20,0.9)';
      ctx.lineWidth = Math.max(3, Math.round(tagPx * 0.12));
      ctx.strokeText(tag, width / 2, tagY);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(tag, width / 2, tagY);
      ctx.restore();
    }
  }

  function drawFrame(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, width - 28, height - 28);
    ctx.strokeStyle = 'rgba(255,209,102,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, width - 52, height - 52);
    ctx.restore();
  }

  async function drawCover(canvas, state) {
    var size = global.ViceCoverState.sizeOf(state);
    var width = size.width;
    var height = size.height;
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0b0714';
    ctx.fillRect(0, 0, width, height);

    var photos = [state.photo, state.photo2];
    var images = await Promise.all(photos.map(function (src) {
      return loadImage(src).catch(function () { return null; });
    }));
    // A failed photo falls back to the other one, then to a flat panel.
    var usable = images.filter(Boolean);
    if (usable.length === 0) {
      ctx.fillStyle = '#241338';
      ctx.fillRect(0, 0, width, height);
    }
    var gutter = 10;
    var panels = panelsFor(state.layout, width, height, gutter);
    panels.forEach(function (rect, i) {
      var img = usable.length ? usable[i % usable.length] : null;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      if (img) drawCoverFit(ctx, img, rect.x, rect.y, rect.w, rect.h);
      else { ctx.fillStyle = '#2a1844'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    });

    applyGrade(ctx, width, height, state.grade, state.mix);

    try {
      await global.document.fonts.load("80px Anton");
      await global.document.fonts.ready;
    } catch (err) { /* fall back to the sans-serif stack */ }
    drawTitleBlock(ctx, width, height, state.caption, state.tagline);
    drawFrame(ctx, width, height);
    return canvas;
  }

  global.ViceCoverDraw = { drawCover: drawCover, loadImage: loadImage, GRADES: GRADES, panelsFor: panelsFor };
})(window);
