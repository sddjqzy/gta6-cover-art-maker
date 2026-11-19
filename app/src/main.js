// Vice Cover — editor wiring.
// Loads the two photos, binds every control to the live preview, exports
// the finished cover as a PNG, and honours shareable URL parameters.

import { DEFAULT_STATE, SIZES, stateFromParams, stateToQuery } from './state.js';
import { drawCover, loadImage } from './cover.js';
import { prepareShot, shotMode } from './shots.js';

const $ = (id) => document.getElementById(id);

const state = stateFromParams(window.location.search);
const mode = shotMode(window.location.search);
prepareShot(document, mode);

// The two photos, loaded once and reloaded on upload.
const photos = { photo1: null, photo2: null };
let renderToken = 0;

async function loadPhoto(key, src) {
  try {
    photos[key] = await loadImage(src);
  } catch {
    photos[key] = await loadImage(DEFAULT_STATE[key]);
  }
}

function render() {
  const token = ++renderToken;
  const canvas = $('coverCanvas');
  try {
    drawCover(canvas, state, photos);
  } catch (err) {
    console.error('render failed', err);
  }
  // Signal staged screenshots that this frame is done.
  if (token === renderToken) {
    window.__viceCoverReady = true;
    document.body.dataset.rendered = 'true';
  }
}

function syncControls() {
  $('captionInput').value = state.caption;
  $('taglineInput').value = state.tagline;
  $('layoutSelect').value = state.layout;
  $('gradeSelect').value = state.grade;
  $('sizeSelect').value = state.size;
  $('mixRange').value = String(state.mix);
  $('mixValue').textContent = `${state.mix}%`;
  $('shareLink').textContent = `${window.location.pathname}?${stateToQuery(state)}`;
}

function bindControls() {
  $('captionInput').addEventListener('input', (e) => {
    state.caption = e.target.value;
    syncShareOnly();
    render();
  });
  $('taglineInput').addEventListener('input', (e) => {
    state.tagline = e.target.value;
    syncShareOnly();
    render();
  });
  $('layoutSelect').addEventListener('change', (e) => { state.layout = e.target.value; afterChange(); });
  $('gradeSelect').addEventListener('change', (e) => { state.grade = e.target.value; afterChange(); });
  $('sizeSelect').addEventListener('change', (e) => { state.size = e.target.value; afterChange(); });
  $('mixRange').addEventListener('input', (e) => {
    state.mix = Number(e.target.value);
    $('mixValue').textContent = `${state.mix}%`;
    syncShareOnly();
    render();
  });
  $('photo1Input').addEventListener('change', (e) => onUpload('photo1', e.target.files[0]));
  $('photo2Input').addEventListener('change', (e) => onUpload('photo2', e.target.files[0]));
  $('sampleBtn').addEventListener('click', async () => {
    state.photo1 = DEFAULT_STATE.photo1;
    state.photo2 = DEFAULT_STATE.photo2;
    await loadPhoto('photo1', state.photo1);
    await loadPhoto('photo2', state.photo2);
    render();
  });
  $('exportBtn').addEventListener('click', exportPng);
}

function syncShareOnly() {
  $('shareLink').textContent = `${window.location.pathname}?${stateToQuery(state)}`;
}

function afterChange() {
  syncControls();
  render();
}

async function onUpload(key, file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    photos[key] = await loadImage(url);
    state[key] = file.name;
    render();
  } catch {
    URL.revokeObjectURL(url);
  }
}

function exportPng() {
  const offscreen = document.createElement('canvas');
  drawCover(offscreen, state, photos);
  offscreen.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vice-cover.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

async function init() {
  bindControls();
  syncControls();
  document.fonts?.load('16px Anton').catch(() => {});
  await Promise.all([
    loadPhoto('photo1', state.photo1),
    loadPhoto('photo2', state.photo2),
  ]);
  // Size options show their pixel dimensions.
  for (const option of $('sizeSelect').options) {
    const size = SIZES[option.value];
    if (size) option.textContent = size.label;
  }
  render();
  // Re-render once the display font arrives so the title uses Anton.
  document.fonts?.ready.then(() => render()).catch(() => {});
}

init();
