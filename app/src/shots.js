// Vice Cover — staged screenshot mode.
// Reads ?shot=cover|editor from the URL. In cover mode the editor chrome
// is hidden so the screenshot is just the cover; in editor mode the full
// interface stays visible. Every other parameter (photo, photo2, caption,
// tagline, layout, grade, size, mix) is handled by state.js.

export function shotMode(search) {
  const mode = new URLSearchParams(search || '').get('shot');
  return mode === 'cover' ? 'cover' : 'editor';
}

/** Apply the shot mode to the page: hide the editor chrome for a cover shot. */
export function prepareShot(document, mode) {
  document.body.classList.add(mode === 'cover' ? 'shot-cover' : 'shot-editor');
  document.body.dataset.shot = mode;
  if (mode === 'cover') {
    document.title = 'Vice Cover — cover';
  }
}
