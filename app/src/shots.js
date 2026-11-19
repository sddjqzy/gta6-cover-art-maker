// Vice Cover shot staging: arranges a fixed scene from the URL so the
// screenshots are reproducible.
//
//   ?shot=cover   bare cover, no editor chrome, canvas fills the viewport
//   ?shot=editor  full editor interface (the default)
// Other parameters (photo, photo2, caption, tagline, layout, grade,
// size, mix) come from state.js and are applied by main.js first.
// When the scene is painted, window.__viceShotReady is set to true so
// a screenshot script knows the frame is ready to capture.
(function (global) {
  'use strict';

  function stage() {
    var state = global.ViceCover && global.ViceCover.state;
    if (!state) return;
    if (state.shot !== 'cover') {
      global.__viceShotReady = true;
      return;
    }
    global.document.body.classList.add('shot-cover');
    var canvas = global.document.getElementById('coverCanvas');
    // In cover mode the canvas is the whole page: size it to the
    // requested cover size, CSS stretches it to the viewport.
    global.ViceCover.redraw().then(function () {
      if (canvas) {
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
      }
      global.__viceShotReady = true;
    }).catch(function (err) {
      console.error(err);
      global.__viceShotReady = true;
    });
  }

  function waitForEditor() {
    if (global.ViceCover && global.ViceCover.state) { stage(); return; }
    setTimeout(waitForEditor, 50);
  }

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', waitForEditor);
  } else {
    waitForEditor();
  }
})(window);
