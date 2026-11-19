// Vice Cover: fixed scenes for screenshots. A `?shot=` query sets up one
// scene instead of the empty editor: `cover` hides the controls and shows
// only the cover, `editor` shows the editor with photos loaded. `photo`
// picks a sample, `caption` / `tagline` / `layout` / `grade` / `size` set the
// cover. window.__shotReady is set once the cover has been painted.

/** Loads a sample photo by name from app/samples/. */
export function sampleUrl(name) {
  return `samples/${name}.jpg`;
}

export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const size = query.get('size');
  if (size) api.setSize(size);
  const layout = query.get('layout');
  if (layout) api.setLayout(layout);
  const grade = query.get('grade');
  if (grade) api.setGrade(grade);
  const caption = query.get('caption');
  if (caption !== null) api.setCaption(caption);
  const tagline = query.get('tagline');
  if (tagline !== null) api.setTagline(tagline);
  const lettering = query.get('lettering');
  if (lettering) api.setLettering(lettering);
  // Two photos when the scene asks for them: the second fills the side panels.
  const photo = query.get('photo') ?? 'pier';
  const photo2 = query.get('photo2');
  await api.loadSample(sampleUrl(photo));
  if (photo2) {
    await api.loadSample(sampleUrl(photo2));
    api.setOnePhotoEverywhere(false);
    if (query.get('mix') === 'alternate') api.setMix('alternate');
  }
  if (query.get('zoom')) api.setZoom(Number(query.get('zoom')));
  // Paint once right away so the scene is visible even if a font is slow;
  // the second paint below uses the loaded display font.
  api.redraw();
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    api.redraw();
    window.__shotReady = true;
  }));
}
