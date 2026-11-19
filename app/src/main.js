// Vice Cover — editor logic: control wiring, live preview, PNG export, URL params.
(function () {
  'use strict';

  var parsed = window.ViceState.fromParams(window.location.search);
  var state = parsed.state;
  var shot = parsed.shot;
  var canvas = document.getElementById('cover');
  var images = { photo: null, photo2: null };
  var fontReady = false;

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function render() {
    if (images.photo && images.photo2) {
      window.ViceCover.drawCover(canvas, state, images);
    }
  }

  function refreshImages() {
    return Promise.all([loadImage(state.photo), loadImage(state.photo2)]).then(function (pair) {
      images.photo = pair[0];
      images.photo2 = pair[1];
      var t1 = document.getElementById('thumb1');
      var t2 = document.getElementById('thumb2');
      if (t1 && pair[0]) t1.src = state.photo;
      if (t2 && pair[1]) t2.src = state.photo2;
      render();
    });
  }

  function syncControls() {
    var cap = document.getElementById('caption');
    var tag = document.getElementById('tagline');
    var mix = document.getElementById('mix');
    var mixVal = document.getElementById('mix-value');
    if (cap) cap.value = state.caption;
    if (tag) tag.value = state.tagline;
    if (mix) mix.value = String(Math.round(state.mix * 100));
    if (mixVal) mixVal.textContent = Math.round(state.mix * 100) + '%';
    [['layout-seg', 'layout'], ['grade-seg', 'grade'], ['size-seg', 'size']].forEach(function (pair) {
      var seg = document.getElementById(pair[0]);
      if (!seg) return;
      seg.querySelectorAll('button').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-value') === state[pair[1]]);
      });
    });
  }

  function bindSeg(id, key, after) {
    var seg = document.getElementById(id);
    if (!seg) return;
    seg.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state[key] = btn.getAttribute('data-value');
        syncControls();
        if (after) after();
        render();
      });
    });
  }

  function bindUpload(inputId, key) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        state[key] = String(reader.result);
        refreshImages();
      };
      reader.readAsDataURL(file);
    });
  }

  function bindSample(btnId, key, sample) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', function () {
      state[key] = sample;
      refreshImages();
    });
  }

  function exportPNG() {
    render();
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vice-cover-' + state.layout + '-' + state.grade + '-' + state.size + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }, 'image/png');
  }

  function copyLink() {
    var url = window.location.origin + window.location.pathname + window.ViceState.toParams(state, 'editor');
    var done = function () {
      var btn = document.getElementById('copy-link');
      if (btn) {
        var old = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = old; }, 1500);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* clipboard unavailable */ }
      ta.remove();
      done();
    }
  }

  function shuffle() {
    var layouts = window.ViceState.layouts;
    var grades = window.ViceState.grades;
    var sizes = Object.keys(window.ViceState.sizes);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.size = sizes[Math.floor(Math.random() * sizes.length)];
    state.mix = 0.4 + Math.random() * 0.35;
    syncControls();
    render();
  }

  function init() {
    if (shot === 'cover') return; // shots.js owns the cover view
    syncControls();
    var cap = document.getElementById('caption');
    var tag = document.getElementById('tagline');
    var mix = document.getElementById('mix');
    if (cap) cap.addEventListener('input', function () { state.caption = cap.value; render(); });
    if (tag) tag.addEventListener('input', function () { state.tagline = tag.value; render(); });
    if (mix) {
      mix.addEventListener('input', function () {
        state.mix = window.ViceState.clampMix(parseInt(mix.value, 10) / 100);
        var mixVal = document.getElementById('mix-value');
        if (mixVal) mixVal.textContent = mix.value + '%';
        render();
      });
    }
    bindSeg('layout-seg', 'layout');
    bindSeg('grade-seg', 'grade');
    bindSeg('size-seg', 'size');
    bindUpload('photo1', 'photo');
    bindUpload('photo2', 'photo2');
    bindSample('use-sample1', 'photo', 'samples/boulevard.jpg');
    bindSample('use-sample2', 'photo2', 'samples/pier.jpg');
    var exp = document.getElementById('export');
    var copy = document.getElementById('copy-link');
    var shuf = document.getElementById('shuffle');
    if (exp) exp.addEventListener('click', exportPNG);
    if (copy) copy.addEventListener('click', copyLink);
    if (shuf) shuf.addEventListener('click', shuffle);
    refreshImages();
  }

  // Load Anton before the first draw so titles render in the right face.
  function boot() {
    var font = new FontFace('Anton', 'url(fonts/Anton-Regular.ttf)');
    font.load().then(function (f) {
      document.fonts.add(f);
      fontReady = true;
      render();
    }).catch(function () {
      fontReady = false;
      render();
    });
    init();
    window.ViceEditor = { state: state, render: render, refreshImages: refreshImages, exportPNG: exportPNG };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
