// Fixed scenes for screenshots: ?shot=cover shows the finished cover alone,
// ?shot=editor shows the editor with a photo loaded. The query also carries
// the cover's choices: photo, photo2, caption, tagline, layout, grade, size
// and mix. window.__shotReady is set once the scene has painted.

import { LAYOUTS, GRADES, SIZES, PHOTOS } from './state.js';

/** Pick a query value only when it is one of the allowed choices. */
function pick(query, name, allowed, fallback) {
  const value = query.get(name);
  return value !== null && allowed.includes(value) ? value : fallback;
}

/** Read the cover choices out of the URL query, with sane defaults. */
export function shotState(query) {
  return {
    photo: pick(query, 'photo', PHOTOS, 'pier'),
    photo2: pick(query, 'photo2', PHOTOS, 'boulevard'),
    caption: query.get('caption') ?? 'VICE CITY NIGHTS',
    tagline: query.get('tagline') ?? 'Two shores. One score.',
    layout: pick(query, 'layout', LAYOUTS, 'trio'),
    grade: pick(query, 'grade', GRADES, 'sunset'),
    size: pick(query, 'size', Object.keys(SIZES), 'square'),
    mix: pick(query, 'mix', ['alt', 'one'], 'alt'),
  };
}

/**
 * Set up a screenshot scene: hide the controls for a cover shot, apply the
 * query's choices through `apply`, wait for the paint, then flag readiness.
 */
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await apply(shotState(query));
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
