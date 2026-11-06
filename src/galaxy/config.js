// Galaxy tuning. Modules take these as parameter defaults, so callers and tests can override them.

export const CELL_PX = 120;

// Background stars per cell, and their icon size in px (matches the old Math.random() * 19 + 1).
export const DENSITY = { min: 0, max: 4 };
export const BG_STAR_SIZE = { min: 1, max: 20 };

// Stars in one cell keep this far apart; a star that can't find room in TRIES attempts is dropped.
export const BG_STAR_MIN_GAP_PX = 24;
export const BG_STAR_TRIES = 8;

// Cells around each blog star (in every direction) kept free of background stars.
export const BLOG_CLEAR_RADIUS = 1;

// 0 = flat; higher = stronger curve toward the edges.
export const LENS_STRENGTH = 1.0;

// The lens shader's invR: globe radius R = half the viewport's longer side / strength, so the look is the same on any screen.
export const lensInvRadius = ({ width, height }, strength = LENS_STRENGTH) => strength / (Math.max(width, height) / 2);

// Fraction of drag velocity kept per frame after release.
export const INERTIA = 0.92;

export const KEY_STEP = CELL_PX;

// Pointer travel below this counts as a click, not a drag.
export const CLICK_THRESHOLD_PX = 5;

// Used until the backend serves its own grid size and seed.
export const DEFAULT_GALAXY = { cols: 64, rows: 64, seed: 1 };
