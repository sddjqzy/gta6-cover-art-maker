// Vice Cover: the editor. Wires the controls to the state, draws the live
// preview, and exports the cover as a PNG. Photos are read on this machine
// only — nothing is uploaded anywhere.
//
// Drag on the preview to slide the selected panel's photo inside its frame;
// the mouse wheel (or the zoom slider) zooms it. Click a panel to select it,
// then pick which photo it shows from the panel list.

import { renderCover } from './cover.js';
import { runShot } from './shots.js';
import {
  GRADES, LAYOUTS, LETTERING, SIZES,
  defaultState, panelCount, panelRects,
} from './state.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const taglineInput = document.getElementById('tagline');
const status = document.getElementById('status');
const photoStrip = document.getElementById('photo-strip');
const panelList = document.getElementById('panel-list');
const zoomSlider = document.getElementById('zoom');
const sizeRow = document.getElementById('size-row');
const layoutRow = document.getElementById('layout-row');
const gradeRow = document.getElementById('grade-row');
const letteringRow = document.getElementById('lettering-row');

const state = defaultState();
/** Loaded photos, in the order they were added. Index 0 is the hero photo. */
const photos = [];
let dragging = null;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function currentSize() {
  return SIZES[state.size] ?? SIZES.square;
}

function redraw() {
  const { width, height } = currentSize();
  canvas.width = width;
  canvas.height = height;
  renderCover(canvas.getContext('2d'), state, photos, width, height);
  syncPanelList();
}

/** Rebuilds the per-panel rows (photo picker + zoom) for the layout. */
function syncPanelList() {
  const n = panelCount(state.layout);
  panelList.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const row = document.createElement('div');
    row.className = 'panel-row' + (state.selectedPanel === i ? ' selected' : '');
    const label = document.createElement('span');
    label.textContent = `Panel ${i + 1}`;
    const pick = document.createElement('select');
    pick.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    photos.forEach((photo, pi) => {
      const option = document.createElement('option');
      option.value = String(pi);
      option.textContent = photo.dataset.name || `Photo ${pi + 1}`;
      pick.appendChild(option);
    });
    pick.value = String(state.panels[i].photo);
    pick.disabled = state.onePhotoEverywhere || photos.length < 2;
    pick.addEventListener('change', () => {
      state.panels[i].photo = Number(pick.value);
      redraw();
    });
    row.addEventListener('click', (event) => {
      if (event.target === pick) return;
      state.selectedPanel = i;
      zoomSlider.value = String(state.panels[i].zoom);
      redraw();
    });
    row.append(label, pick);
    panelList.appendChild(row);
  }
}

/** Rebuilds the photo strip thumbnails. */
function syncPhotoStrip() {
  photoStrip.innerHTML = '';
  photos.forEach((photo, pi) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'thumb' + (pi === 0 ? ' hero' : '');
    thumb.title = photo.dataset.name || `Photo ${pi + 1}`;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = thumb.title;
    thumb.appendChild(img);
    thumb.addEventListener('click', () => {
      if (state.onePhotoEverywhere) {
        // Make the clicked photo the one every panel shows.
        photos.unshift(photos.splice(pi, 1)[0]);
      } else {
        state.panels[state.selectedPanel].photo = pi;
      }
      redraw();
    });
    photoStrip.appendChild(thumb);
  });
  const count = document.getElementById('photo-count');
  count.textContent = photos.length ? `${photos.length} photo${photos.length > 1 ? 's' : ''} loaded` : 'No photos yet — try a sample below';
}

/** Adds image files from the picker, then redraws. */
async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    img.dataset.name = file.name;
    photos.push(img);
  }
  syncPhotoStrip();
  redraw();
}

/** Makes a row of toggle buttons from a table of {id: {label}} entries. */
function buildToggles(row, entries, current, onPick) {
  row.innerHTML = '';
  for (const [id, entry] of Object.entries(entries)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toggle' + (id === current ? ' active' : '');
    button.textContent = entry.label;
    button.title = entry.hint || entry.label;
    button.addEventListener('click', () => {
      onPick(id);
      buildToggles(row, entries, id, onPick);
      redraw();
    });
    row.appendChild(button);
  }
}

function buildControls() {
  buildToggles(sizeRow, SIZES, state.size, (id) => { state.size = id; });
  buildToggles(layoutRow, LAYOUTS, state.layout, (id) => {
    state.layout = id;
    state.selectedPanel = 0;
    zoomSlider.value = String(state.panels[0].zoom);
  });
  buildToggles(gradeRow, GRADES, state.grade, (id) => { state.grade = id; });
  buildToggles(letteringRow, LETTERING, state.lettering, (id) => { state.lettering = id; });
}

// --- Controls -------------------------------------------------------------

document.getElementById('photos').addEventListener('change', (event) => {
  addFiles(event.target.files);
  event.target.value = '';
});
document.getElementById('sample-pier').addEventListener('click', async () => {
  photos.push(await loadImage('samples/pier.jpg'));
  photos[photos.length - 1].dataset.name = 'Pier sample';
  syncPhotoStrip();
  redraw();
});
document.getElementById('sample-boulevard').addEventListener('click', async () => {
  photos.push(await loadImage('samples/boulevard.jpg'));
  photos[photos.length - 1].dataset.name = 'Boulevard sample';
  syncPhotoStrip();
  redraw();
});
document.getElementById('fill-all').addEventListener('click', () => {
  state.onePhotoEverywhere = true;
  state.panels.forEach((p) => { p.photo = 0; });
  redraw();
});
document.getElementById('fill-each').addEventListener('click', () => {
  state.onePhotoEverywhere = false;
  state.panels.forEach((p, i) => { p.photo = Math.min(i, photos.length - 1); });
  redraw();
});
document.getElementById('reset-crop').addEventListener('click', () => {
  const panel = state.panels[state.selectedPanel];
  panel.x = 0;
  panel.y = 0;
  panel.zoom = 1;
  zoomSlider.value = '1';
  redraw();
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });
zoomSlider.addEventListener('input', () => {
  state.panels[state.selectedPanel].zoom = Number(zoomSlider.value);
  redraw();
});

// --- Drag to crop, wheel to zoom ------------------------------------------

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = (clientX - rect.left) * (canvas.width / rect.width);
  const py = (clientY - rect.top) * (canvas.height / rect.height);
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  return { hit: rects.findIndex((r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h), px, py };
}

canvas.addEventListener('pointerdown', (event) => {
  const { hit, px, py } = panelAt(event.clientX, event.clientY);
  if (hit < 0) return;
  state.selectedPanel = hit;
  zoomSlider.value = String(state.panels[hit].zoom);
  canvas.setPointerCapture(event.pointerId);
  dragging = { panel: hit, lastX: px, lastY: py };
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const { px, py } = panelAt(event.clientX, event.clientY);
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const rect = rects[dragging.panel];
  const panel = state.panels[dragging.panel];
  panel.x += ((px - dragging.lastX) / rect.w) * 2;
  panel.y += ((py - dragging.lastY) / rect.h) * 2;
  panel.x = Math.max(-1, Math.min(1, panel.x));
  panel.y = Math.max(-1, Math.min(1, panel.y));
  dragging.lastX = px;
  dragging.lastY = py;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const { hit } = panelAt(event.clientX, event.clientY);
  if (hit < 0) return;
  state.selectedPanel = hit;
  const panel = state.panels[hit];
  panel.zoom = Math.max(0.5, Math.min(3, panel.zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
  zoomSlider.value = String(panel.zoom);
  redraw();
}, { passive: false });

// --- Export -----------------------------------------------------------------

document.getElementById('export').addEventListener('click', () => {
  const { width, height } = currentSize();
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  renderCover(off.getContext('2d'), state, photos, width, height);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${width}x${height}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${width}x${height}.png`;
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
});

// --- Screenshot scenes ------------------------------------------------------

const shotApi = {
  async loadSample(url) {
    const img = await loadImage(url);
    img.dataset.name = url.split('/').pop();
    photos.push(img);
    syncPhotoStrip();
  },
  setSize(id) { if (SIZES[id]) { state.size = id; buildControls(); } },
  setLayout(id) { if (LAYOUTS[id]) { state.layout = id; state.selectedPanel = 0; buildControls(); } },
  setGrade(id) { if (GRADES[id]) { state.grade = id; buildControls(); } },
  setCaption(text) { state.title = text; titleInput.value = text; },
  setTagline(text) { state.tagline = text; taglineInput.value = text; },
  setLettering(id) { if (LETTERING[id]) { state.lettering = id; buildControls(); } },
  setOnePhotoEverywhere(value) {
    state.onePhotoEverywhere = value;
    if (!value) state.panels.forEach((p, i) => { p.photo = Math.min(i, photos.length - 1); });
  },
  setMix(mode) {
    if (mode === 'alternate') {
      state.panels.forEach((p, i) => { p.photo = photos.length ? i % photos.length : 0; });
    }
  },
  setZoom(value) { state.panels.forEach((p) => { p.zoom = value; }); },
  redraw,
};

// --- Start ------------------------------------------------------------------

titleInput.value = state.title;
taglineInput.value = state.tagline;
buildControls();
syncPhotoStrip();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), shotApi);
} else {
  // Load the pier sample so the first paint already shows a cover.
  loadImage('samples/pier.jpg').then((img) => {
    img.dataset.name = 'Pier sample';
    photos.push(img);
    syncPhotoStrip();
    redraw();
  }).catch(() => redraw());
  document.fonts.ready.then(() => redraw());
  redraw();
}
