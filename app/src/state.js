// Vice Cover's state: one plain object holding every choice the editor makes,
// plus a tiny subscribe/notify so any change re-renders the preview.
//
// Nothing here touches the DOM or the canvas. main.js owns the images (an
// <img> per photo key) and hands them to cover.js when it draws; this module
// only remembers *which* photo, words, layout, grade and size are active.

export const PHOTOS = ['pier', 'boulevard'];

export const LAYOUTS = ['trio', 'quad', 'duo'];

export const GRADES = ['sunset', 'neon', 'teal'];

export const SIZES = {
  square: { label: 'Square 1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait 1024 x 1280', width: 1024, height: 1280 },
  wide: { label: 'Wide 1280 x 720', width: 1280, height: 720 },
};

/** The editor's starting choices: pier first, boulevard second, trio sunset square. */
export function defaultState() {
  return {
    photo: 'pier',
    photo2: 'boulevard',
    caption: 'VICE CITY NIGHTS',
    tagline: 'Two shores. One score.',
    layout: 'trio',
    grade: 'sunset',
    size: 'square',
    // How the two photos share the panels: 'alt' alternates them panel by
    // panel, 'one' fills every panel with the first photo.
    mix: 'alt',
  };
}

const listeners = new Set();

/** The live state object. Read it directly; change it only through update(). */
export const state = defaultState();

/** Merge `patch` into the state, then tell every subscriber to re-render. */
export function update(patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (key in state) state[key] = value;
  }
  for (const fn of listeners) fn(state);
}

/** Reset every choice to the defaults and notify subscribers. */
export function resetState() {
  Object.assign(state, defaultState());
  for (const fn of listeners) fn(state);
}

/** Register a render callback; returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The pixel size of the cover the current state asks for. */
export function coverSize(current = state) {
  return SIZES[current.size] ?? SIZES.square;
}

/**
 * Which photo key fills each panel of a layout, in panel order.
 * Panels are numbered left to right, top to bottom.
 */
export function panelPhotos(current = state) {
  const count = current.layout === 'quad' ? 4 : current.layout === 'duo' ? 2 : 3;
  const first = current.photo;
  const second = current.photo2;
  if (current.mix === 'one' || !second) return Array(count).fill(first);
  const out = [];
  for (let i = 0; i < count; i++) out.push(i % 2 === 0 ? first : second);
  return out;
}
