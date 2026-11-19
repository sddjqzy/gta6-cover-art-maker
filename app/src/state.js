// Vice Cover state: one plain object, defaults, and URL parsing.
//
// Kept dependency-free on purpose: cover.js draws from this state,
// main.js binds the controls to it, shots.js seeds it from the URL.
(function (global) {
  'use strict';

  var SIZES = {
    square: { width: 1080, height: 1080, label: 'Square 1080 x 1080' },
    portrait: { width: 1024, height: 1280, label: 'Portrait 1024 x 1280' },
    wide: { width: 1280, height: 720, label: 'Wide 1280 x 720' },
  };
  var LAYOUTS = ['trio', 'quad', 'duo'];
  var GRADES = ['sunset', 'neon', 'teal'];

  function defaults() {
    return {
      caption: 'VICE CITY',
      tagline: 'WELCOME BACK TO LEONIDA',
      photo: 'samples/boulevard.jpg',
      photo2: 'samples/pier.jpg',
      layout: 'trio',
      grade: 'sunset',
      size: 'square',
      mix: 0.55,
      shot: 'editor',
    };
  }

  function clamp01(value) {
    var n = Number(value);
    if (!isFinite(n)) return 0.55;
    return Math.min(1, Math.max(0, n));
  }

  function pick(value, allowed, fallback) {
    return allowed.indexOf(value) !== -1 ? value : fallback;
  }

  // Parse the editor's URL parameters. Unknown or out-of-range values
  // fall back to the defaults instead of breaking the preview.
  // Supported: ?shot=cover|editor, photo, photo2, caption, tagline,
  // layout=trio|quad|duo, grade=sunset|neon|teal,
  // size=square|portrait|wide, mix=0..1.
  function fromSearch(search) {
    var state = defaults();
    var params = new URLSearchParams(search || '');
    if (params.has('shot')) state.shot = pick(params.get('shot'), ['cover', 'editor'], 'editor');
    if (params.has('photo') && params.get('photo')) state.photo = params.get('photo');
    if (params.has('photo2') && params.get('photo2')) state.photo2 = params.get('photo2');
    if (params.has('caption')) state.caption = params.get('caption').slice(0, 24);
    if (params.has('tagline')) state.tagline = params.get('tagline').slice(0, 48);
    if (params.has('layout')) state.layout = pick(params.get('layout'), LAYOUTS, 'trio');
    if (params.has('grade')) state.grade = pick(params.get('grade'), GRADES, 'sunset');
    if (params.has('size')) state.size = Object.prototype.hasOwnProperty.call(SIZES, params.get('size')) ? params.get('size') : 'square';
    if (params.has('mix')) state.mix = clamp01(params.get('mix'));
    return state;
  }

  function sizeOf(state) {
    return SIZES[state.size] || SIZES.square;
  }

  function toSearch(state) {
    var params = new URLSearchParams();
    params.set('caption', state.caption);
    params.set('tagline', state.tagline);
    params.set('layout', state.layout);
    params.set('grade', state.grade);
    params.set('size', state.size);
    params.set('mix', String(state.mix));
    return '?' + params.toString();
  }

  global.ViceCoverState = { defaults: defaults, fromSearch: fromSearch, sizeOf: sizeOf, toSearch: toSearch, SIZES: SIZES, LAYOUTS: LAYOUTS, GRADES: GRADES };
})(window);
