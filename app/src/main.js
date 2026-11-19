// Vice Cover editor logic: binds the controls to the state, redraws
// the live preview on every change, and exports the cover as a PNG.
// URL parameters (?caption=&layout=&grade=&size=&mix=...) seed the
// editor on load; shots.js takes over when ?shot=cover is set.
(function (global) {
  'use strict';

  var state = null;
  var canvas = null;
  var drawing = null;

  function $(id) { return global.document.getElementById(id); }

  function redraw() {
    if (!canvas || !state) return Promise.resolve();
    if (!drawing) {
      drawing = global.ViceCoverDraw.drawCover(canvas, state)
        .catch(function (err) { console.error(err); })
        .finally(function () { drawing = null; });
    }
    return drawing;
  }

  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('could not read file')); };
      reader.readAsDataURL(file);
    });
  }

  function bindFileInput(input, key) {
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      readFileAsDataURL(file).then(function (url) {
        state[key] = url;
        redraw();
      }).catch(function (err) { console.error(err); });
    });
  }

  function slug(text) {
    return (text || 'vice-cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'vice-cover';
  }

  function exportPNG() {
    redraw().then(function () {
      canvas.toBlob(function (blob) {
        if (!blob) return;
        var url = URL.createObjectURL(blob);
        var a = global.document.createElement('a');
        a.href = url;
        a.download = slug(state.caption) + '-' + state.layout + '-' + state.grade + '-' + state.size + '.png';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      }, 'image/png');
    });
  }

  function init() {
    state = global.ViceCoverState.fromSearch(global.location.search);
    canvas = $('coverCanvas');
    global.ViceCover = { state: state, redraw: redraw, exportPNG: exportPNG };

    // Seed the controls from the state (URL params included).
    $('caption').value = state.caption;
    $('tagline').value = state.tagline;
    $('layout').value = state.layout;
    $('grade').value = state.grade;
    $('size').value = state.size;
    $('mix').value = String(Math.round(state.mix * 100));
    $('mixValue').textContent = Math.round(state.mix * 100) + '%';

    $('caption').addEventListener('input', function (e) { state.caption = e.target.value; redraw(); });
    $('tagline').addEventListener('input', function (e) { state.tagline = e.target.value; redraw(); });
    $('layout').addEventListener('change', function (e) { state.layout = e.target.value; redraw(); });
    $('grade').addEventListener('change', function (e) { state.grade = e.target.value; redraw(); });
    $('size').addEventListener('change', function (e) { state.size = e.target.value; redraw(); });
    $('mix').addEventListener('input', function (e) {
      state.mix = Number(e.target.value) / 100;
      $('mixValue').textContent = e.target.value + '%';
      redraw();
    });
    bindFileInput($('photo'), 'photo');
    bindFileInput($('photo2'), 'photo2');
    $('exportBtn').addEventListener('click', exportPNG);
    $('resetBtn').addEventListener('click', function () {
      var fresh = global.ViceCoverState.defaults();
      fresh.shot = state.shot;
      state = fresh;
      global.ViceCover.state = state;
      $('caption').value = state.caption;
      $('tagline').value = state.tagline;
      $('layout').value = state.layout;
      $('grade').value = state.grade;
      $('size').value = state.size;
      $('mix').value = String(Math.round(state.mix * 100));
      $('mixValue').textContent = Math.round(state.mix * 100) + '%';
      $('photo').value = '';
      $('photo2').value = '';
      redraw();
    });

    redraw();
  }

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
