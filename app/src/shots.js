// Vice Cover — staged shots: ?shot=cover renders a full-bleed cover for the
// screenshot harness; ?shot=editor (default) shows the editor. The cover shot
// hides the editor chrome and sizes the canvas to the viewport so a screenshot
// at the size's pixel dimensions captures exactly the cover.
(function () {
  'use strict';

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function stageCover() {
    var parsed = window.ViceState.fromParams(window.location.search);
    var state = parsed.state;
    var size = window.ViceState.sizeOf(state);
    document.body.style.margin = '0';
    document.body.style.background = '#000';
    var topbar = document.querySelector('.topbar');
    var panel = document.querySelector('.panel');
    var hint = document.getElementById('preview-hint');
    if (topbar) topbar.style.display = 'none';
    if (panel) panel.style.display = 'none';
    if (hint) hint.style.display = 'none';
    var layout = document.querySelector('.layout');
    if (layout) {
      layout.style.display = 'block';
      layout.style.padding = '0';
      layout.style.margin = '0';
      layout.style.maxWidth = 'none';
    }
    var pane = document.querySelector('.preview-pane');
    if (pane) pane.style.display = 'block';
    var canvas = document.getElementById('cover');
    canvas.style.width = size.w + 'px';
    canvas.style.height = size.h + 'px';
    canvas.style.borderRadius = '0';
    canvas.style.boxShadow = 'none';
    window.scrollTo(0, 0);

    var font = new FontFace('Anton', 'url(fonts/Anton-Regular.ttf)');
    var fontP = font.load().then(function (f) {
      document.fonts.add(f);
    }).catch(function () { /* fall back to system sans */ });
    Promise.all([fontP, loadImage(state.photo), loadImage(state.photo2)]).then(function (results) {
      var images = { photo: results[1], photo2: results[2] };
      window.ViceCover.drawCover(canvas, state, images);
      document.title = 'shot-ready';
    });
  }

  function stageEditor() {
    // Editor mode: main.js already wired everything. Just make sure the canvas
    // is drawn once fonts arrive (main.js handles this); nothing else to stage.
    document.title = 'shot-ready';
  }

  function stage() {
    var shot = window.ViceState.fromParams(window.location.search).shot;
    if (shot === 'cover') stageCover();
    else stageEditor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stage);
  } else {
    stage();
  }
})();
