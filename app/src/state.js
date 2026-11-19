// Vice Cover: the cover maker's state — export sizes, panel layouts, colour
// grades and the per-panel crop each photo gets. Everything here is plain
// data plus the small geometry helpers the renderer and the editor share, so
// the preview on screen and the exported PNG are built from the same numbers.

export const APP_NAME = 'Vice Cover';

/** The three post sizes the bounty asks for: square, portrait, wide. */
export const SIZES = {
  square: { label: 'Square 1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide 1920 x 1080', width: 1920, height: 1080 },
};

/**
 * Panel layouts. Each panel is a rectangle in fractions of the cover, so one
 * layout works at every export size. The caption band is the strip below the
 * panels where the title and tagline sit.
 */
export const LAYOUTS = {
  trio: {
    label: 'Hero trio',
    hint: 'One big panel, two stacked beside it',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 0.72 },
      { x: 0.62, y: 0, w: 0.38, h: 0.36 },
      { x: 0.62, y: 0.36, w: 0.38, h: 0.36 },
    ],
    caption: { x: 0, y: 0.72, w: 1, h: 0.28 },
  },
  quad: {
    label: 'Four corners',
    hint: 'A 2 x 2 grid of panels',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.36 },
      { x: 0.5, y: 0, w: 0.5, h: 0.36 },
      { x: 0, y: 0.36, w: 0.5, h: 0.36 },
      { x: 0.5, y: 0.36, w: 0.5, h: 0.36 },
    ],
    caption: { x: 0, y: 0.72, w: 1, h: 0.28 },
  },
  duo: {
    label: 'Split duo',
    hint: 'Two tall panels side by side',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.72 },
      { x: 0.5, y: 0, w: 0.5, h: 0.72 },
    ],
    caption: { x: 0, y: 0.72, w: 1, h: 0.28 },
  },
};

/**
 * Colour grades. Each grade is a sky gradient for the caption band, a warm
 * wash and a cool wash painted over the photos, and the colours the title
 * gradient runs through.
 */
export const GRADES = {
  sunset: {
    label: 'Vice sunset',
    sky: ['#2b1055', '#7597de', '#ff7e5f', '#feb47b'],
    washWarm: 'rgba(255, 110, 60, 0.20)',
    washCool: 'rgba(120, 40, 160, 0.16)',
    title: ['#fff3b0', '#ffb347', '#ff5e78'],
    sun: '#ffd166',
  },
  neon: {
    label: 'Neon nights',
    sky: ['#0b0033', '#3d0a6e', '#ff2e88', '#00e5ff'],
    washWarm: 'rgba(255, 46, 136, 0.22)',
    washCool: 'rgba(0, 229, 255, 0.18)',
    title: ['#a7f3ff', '#00e5ff', '#ff2e88'],
    sun: '#ff2e88',
  },
  teal: {
    label: 'Teal coast',
    sky: ['#062a33', '#0e7c86', '#f4a259', '#f7ede2'],
    washWarm: 'rgba(244, 162, 89, 0.18)',
    washCool: 'rgba(14, 124, 134, 0.20)',
    title: ['#f7ede2', '#f4a259', '#0e7c86'],
    sun: '#f4a259',
  },
};

/** Lettering styles for the title. */
export const LETTERING = {
  gradient: { label: 'Sunset gradient' },
  solid: { label: 'Solid white' },
  outline: { label: 'Hollow outline' },
};

/** One panel's crop: which photo it shows, and how that photo is shifted. */
export function freshPanel(photoIndex) {
  return { photo: photoIndex, x: 0, y: 0, zoom: 1 };
}

/** The state a fresh cover starts from. */
export function defaultState() {
  return {
    title: 'Sunset Heist',
    tagline: 'A VICE CITY STORY',
    layout: 'trio',
    grade: 'sunset',
    lettering: 'gradient',
    size: 'square',
    onePhotoEverywhere: true,
    selectedPanel: 0,
    panels: [freshPanel(0), freshPanel(0), freshPanel(0), freshPanel(0)],
  };
}

/** Panel rectangles in pixels for a layout at a given cover size. */
export function panelRects(layoutId, width, height) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.trio;
  return layout.panels.map((p) => ({
    x: p.x * width,
    y: p.y * height,
    w: p.w * width,
    h: p.h * height,
  }));
}

/** Caption-band rectangle in pixels for a layout at a given cover size. */
export function captionRect(layoutId, width, height) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.trio;
  const c = layout.caption;
  return { x: c.x * width, y: c.y * height, w: c.w * width, h: c.h * height };
}

/** How many panels the current layout shows. */
export function panelCount(layoutId) {
  return (LAYOUTS[layoutId] ?? LAYOUTS.trio).panels.length;
}
