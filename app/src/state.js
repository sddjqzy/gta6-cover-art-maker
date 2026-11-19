// Vice Cover — state: one plain object, URL parameters in and out.
(function (global) {
  'use strict';

  var LAYOUTS = ['trio', 'quad', 'duo'];
  var GRADES = ['sunset', 'neon', 'teal'];
  var SIZES = {
    square: { w: 1080, h: 1080, label: 'Square 1080×1080' },
    portrait: { w: 1024, h: 1280, label: 'Portrait 1024×1280' },
    wide: { w: 1280, h: 720, label: 'Wide 1280×720' },
  };

  function defaults() {
    return {
      photo: 'samples/boulevard.jpg',
      photo2: 'samples/pier.jpg',
      caption: 'VICE CITY',
      tagline: 'WELCOME BACK',
      layout: 'trio',
      grade: 'sunset',
      size: 'square',
      mix: 0.55,
    };
  }

  function clampMix(v) {
    var n = parseFloat(v);
    if (!isFinite(n)) return 0.55;
    return Math.min(1, Math.max(0, n));
  }

  function pick(list, v, fallback) {
    return list.indexOf(v) !== -1 ? v : fallback;
  }

  // Read ?shot=cover|editor plus every cover parameter out of a query string.
  function fromParams(search) {
    var q = new URLSearchParams(search || '');
    var state = defaults();
    var photo = q.get('photo');
    var photo2 = q.get('photo2');
    if (photo) state.photo = photo;
    if (photo2) state.photo2 = photo2;
    var caption = q.get('caption');
    var tagline = q.get('tagline');
    if (caption !== null) state.caption = caption.slice(0, 24);
    if (tagline !== null) state.tagline = tagline.slice(0, 48);
    state.layout = pick(LAYOUTS, q.get('layout'), 'trio');
    state.grade = pick(GRADES, q.get('grade'), 'sunset');
    state.size = pick(Object.keys(SIZES), q.get('size'), 'square');
    if (q.get('mix') !== null) state.mix = clampMix(q.get('mix'));
    return { state: state, shot: q.get('shot') || 'editor' };
  }

  // Serialise state back to a query string (?shot=editor&photo=...&...).
  function toParams(state, shot) {
    var q = new URLSearchParams();
    q.set('shot', shot || 'editor');
    q.set('photo', state.photo);
    q.set('photo2', state.photo2);
    q.set('caption', state.caption);
    q.set('tagline', state.tagline);
    q.set('layout', state.layout);
    q.set('grade', state.grade);
    q.set('size', state.size);
    q.set('mix', String(Math.round(state.mix * 100) / 100));
    return '?' + q.toString();
  }

  function sizeOf(state) {
    return SIZES[state.size] || SIZES.square;
  }

  global.ViceState = {
    defaults: defaults,
    fromParams: fromParams,
    toParams: toParams,
    sizeOf: sizeOf,
    layouts: LAYOUTS,
    grades: GRADES,
    sizes: SIZES,
    clampMix: clampMix,
  };
})(typeof window !== 'undefined' ? window : globalThis);
