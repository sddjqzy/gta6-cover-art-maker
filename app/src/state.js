// Vice Cover — shared editor state.
// One plain object drives the preview, the PNG export and the staged
// screenshots, so every surface renders exactly the same cover.

export const LAYOUTS = ['trio', 'quad', 'duo'];

export const GRADES = ['sunset', 'neon', 'teal'];

export const SIZES = {
  square: { width: 1080, height: 1080, label: 'Square · 1080 x 1080' },
  portrait: { width: 1024, height: 1280, label: 'Portrait · 1024 x 1280' },
  wide: { width: 1280, height: 720, label: 'Wide · 1280 x 720' },
};

export const SIZE_KEYS = Object.keys(SIZES);

export const SAMPLE_PHOTOS = {
  photo1: 'samples/boulevard.jpg',
  photo2: 'samples/pier.jpg',
};

export const DEFAULT_STATE = {
  photo1: SAMPLE_PHOTOS.photo1,
  photo2: SAMPLE_PHOTOS.photo2,
  caption: 'VICE CITY',
  tagline: 'Sunset boulevard, neon nights.',
  layout: 'trio',
  grade: 'sunset',
  size: 'square',
  // 0-100: how strongly the colour grade washes over the photos.
  mix: 35,
};

const clampInt = (value, min, max) => {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
};

/** A fresh state object with the URL parameters applied on top of the defaults. */
export function stateFromParams(search) {
  const state = { ...DEFAULT_STATE };
  const params = new URLSearchParams(search || '');
  const caption = params.get('caption');
  if (caption) state.caption = caption.slice(0, 60);
  const tagline = params.get('tagline');
  if (tagline) state.tagline = tagline.slice(0, 90);
  const photo = params.get('photo');
  if (photo) state.photo1 = photo;
  const photo2 = params.get('photo2');
  if (photo2) state.photo2 = photo2;
  const layout = params.get('layout');
  if (layout && LAYOUTS.includes(layout)) state.layout = layout;
  const grade = params.get('grade');
  if (grade && GRADES.includes(grade)) state.grade = grade;
  const size = params.get('size');
  if (size && Object.hasOwn(SIZES, size)) state.size = size;
  const mix = clampInt(params.get('mix'), 0, 100);
  if (mix !== null) state.mix = mix;
  return state;
}

/** The pixel dimensions for a state's chosen size. */
export function sizeOf(state) {
  return SIZES[state.size] || SIZES.square;
}

/** Serialise a state back to a query string (for shareable links). */
export function stateToQuery(state) {
  const params = new URLSearchParams();
  params.set('caption', state.caption);
  params.set('tagline', state.tagline);
  params.set('layout', state.layout);
  params.set('grade', state.grade);
  params.set('size', state.size);
  params.set('mix', String(state.mix));
  return params.toString();
}
