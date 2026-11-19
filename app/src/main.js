// Wires the Vice Cover editor: sample photos and uploads, caption and
// tagline fields, layout / grade / size pickers, live preview and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).

import { drawCover } from './cover.js';
import { runShot } from './shots.js';
import { state, update, subscribe, coverSize, SIZES } from './state.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const taglineInput = document.getElementById('tagline');
const status = document.getElementById('status');
const exportButton = document.getElementById('export');

/** Loaded images by photo key: the two samples, plus uploads under their key. */
const images = new Map();

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Size the canvas to the state's export size, then draw the cover into it. */
function render() {
  const { width, height } = coverSize(state);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  drawCover(canvas, state, images);
  const label = SIZES[state.size].label;
  exportButton.textContent = `Export PNG ${label}`;
}

/** Load both sample photos, then render. Uploads replace a sample's image. */
async function loadSamples() {
  for (const key of ['pier', 'boulevard']) {
    try {
      images.set(key, await loadImage(`samples/${key}.jpg`));
    } catch {
      // A missing sample leaves its panels flat; the cover still draws.
    }
  }
  render();
}

/** Mark a radio group in the controls to match the state's value. */
function syncRadios(name, value) {
  for (const input of document.querySelectorAll(`input[name="${name}"]`)) {
    input.checked = input.value === value;
  }
}

/** Push the state's words and choices into every control. */
function syncControls() {
  captionInput.value = state.caption;
  taglineInput.value = state.tagline;
  syncRadios('layout', state.layout);
  syncRadios('grade', state.grade);
  syncRadios('size', state.size);
  document.getElementById('mix').checked = state.mix === 'one';
}

subscribe(() => {
  syncControls();
  render();
});

// Photo pickers: choosing a sample for either slot, or uploading a file.
for (const slot of ['photo', 'photo2']) {
  for (const button of document.querySelectorAll(`[data-slot="${slot}"][data-photo]`)) {
    button.addEventListener('click', async () => {
      update({ [slot]: button.dataset.photo });
      if (!images.has(button.dataset.photo)) {
        images.set(button.dataset.photo, await loadImage(`samples/${button.dataset.photo}.jpg`));
      }
      render();
    });
  }
  const fileInput = document.getElementById(`${slot}-file`);
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const key = `upload-${slot}`;
    images.set(key, await loadImage(URL.createObjectURL(file)));
    update({ [slot]: key });
    status.textContent = `Loaded ${file.name} into the ${slot === 'photo' ? 'first' : 'second'} slot.`;
    render();
  });
}

// Words and the single-photo mix toggle.
captionInput.addEventListener('input', () => update({ caption: captionInput.value }));
taglineInput.addEventListener('input', () => update({ tagline: taglineInput.value }));
document.getElementById('mix').addEventListener('change', (event) => {
  update({ mix: event.target.checked ? 'one' : 'alt' });
});

// Layout, grade and size radios.
for (const name of ['layout', 'grade', 'size']) {
  for (const input of document.querySelectorAll(`input[name="${name}"]`)) {
    input.addEventListener('change', () => update({ [name]: input.value }));
  }
}

// Export: the preview canvas already holds the cover at export size.
exportButton.addEventListener('click', () => {
  render();
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed: the browser could not make the PNG.';
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const { width, height } = coverSize(state);
    link.download = `vice-cover-${width}x${height}.png`;
    link.click();
    status.textContent = `Saved vice-cover-${width}x${height}.png`;
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  }, 'image/png');
});

// Screenshot mode: apply the query's scene, load its photos, draw once.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (scene) => {
    update(scene);
    await loadSamples();
    // The Anton font makes the caption; wait for it before the shot is taken.
    try {
      await document.fonts.load('100px Anton');
    } catch {
      // Fallback lettering still draws if the font cannot load.
    }
    render();
  });
} else {
  loadSamples().then(() => document.fonts.load('100px Anton').then(render).catch(render));
}
