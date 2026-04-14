// ══════════════════════════════════════════
// wall.js — Wall animation + accuracy scoring
// Dev: Fergus
// ══════════════════════════════════════════

import { ctx } from './camera.js';
import { getScoredLandmarks } from './mediapipe.js';

// ── WALL STATE ──
let wallImage      = null;   // currently selected wall Image object
let wallOffsetX    = 0;      // current X position of the wall on canvas
let wallTargetX    = 0;      // final resting X (usually 0 — fully on screen)
let wallAnimating  = false;
let wallSpeed      = 6;      // pixels per frame the wall moves

// ── CUTOUT REGION ──
// This polygon must match the hole in the wall image.
// Developers: update these coordinates to match your wall asset.
// x/y are in canvas pixels. Use a tool like https://www.image-map.net/
// to trace the hole's outline from your wall image.
let cutoutEasy1 = [
  // Example: a rough humanoid running shape — REPLACE with real coordinates
  { x: 633, y: 183 },
  { x: 486, y: 179 },
  { x: 406, y: 300 },
  { x: 446, y: 332 },
  { x: 524, y: 234 },
  { x: 595, y: 246 },
  { x: 462, y: 518 },
  { x: 356, y: 592 },
  { x: 354, y: 685 },
  { x: 401, y: 695 },
  { x: 413, y: 634 },
  { x: 516, y: 559 },
  { x: 576, y: 449 },
  { x: 691, y: 517 },
  { x: 648, y: 653 },
  { x: 764, y: 713 },
  { x: 723, y: 635 },
  { x: 768, y: 481 },
  { x: 644, y: 412 },
  { x: 697, y: 304 },
  { x: 770, y: 385 },
  { x: 904, y: 297 },
  { x: 871, y: 255 },
  { x: 778, y: 314 },
  { x: 720, y: 227 },
  { x: 816, y: 168 },
  { x: 803, y: 71 },
  { x: 722, y: 30 },
  { x: 627, y: 81 },
  // { x: 633, y: 183 }, for "closing" the polygon 
];

// ── CUTOUT DEFINITIONS ──
// Each cutout has: an image path, a polygon, and display metadata.
// Add more entries as your designers create wall assets.
export const CUTOUTS = [
  {
    id:      'running',
    label:   'Runner',
    imgSrc:  'assets/cutouts/easy_1.png',
    polygon: cutoutEasy1,   // replace with real coords per cutout
  },
  // {
  //   id:      'jumping',
  //   label:   'Jumper',
  //   imgSrc:  'assets/cutouts/jumping-wall.png',
  //   polygon: [ ... ],
  // },
];

// Active cutout index
let activeCutout = CUTOUTS[0];

// ── INIT ──
export function initWall() {
  loadWallImage(activeCutout.imgSrc);
  console.log('[Wall] Initialized with cutout:', activeCutout.label);
}

export function setActiveCutout(cutout) {
  activeCutout = cutout;
  loadWallImage(cutout.imgSrc);
}

function loadWallImage(src) {
  wallImage = new Image();
  wallImage.src = src;
}

// ── TRIGGER (called by operator capture button) ──
export function triggerWall(canvasWidth) {
  // Start off-screen to the right
  wallOffsetX   = canvasWidth;
  wallTargetX   = 0;
  wallAnimating = true;
  console.log('[Wall] Triggered — animating in.');
}

export function isWallAnimating() { return wallAnimating; }

// ── DRAW WALL (called every render frame) ──
export function drawWall(canvas) {
  if (!wallImage || !wallImage.complete) return;

  // Advance position
  if (wallAnimating) {
    wallOffsetX -= wallSpeed;
    if (wallOffsetX <= wallTargetX) {
      wallOffsetX   = wallTargetX;
      wallAnimating = false;
      console.log('[Wall] Animation complete.');
    }
  }

  ctx.drawImage(wallImage, wallOffsetX, 0, canvas.width, canvas.height);
}

// ── ACCURACY SCORING ──
/**
 * calculateAccuracy()
 * Returns a 0–100 score: what % of scored landmarks fall inside the cutout hole.
 * Scoring is offset by the wall's current X position so the polygon moves with the wall.
 */
export function calculateAccuracy(canvasWidth, canvasHeight) {
  const landmarks = getScoredLandmarks(canvasWidth, canvasHeight);
  if (!landmarks.length) return 0;

  // Shift polygon by current wall offset so it aligns with the moving image
  const shiftedPolygon = getMirroredPolygon(canvasWidth).map((pt) => ({
    x: pt.x + wallOffsetX,
    y: pt.y,
  }));

  const insideCount = landmarks.filter((lm) =>
    pointInPolygon({ x: lm.x, y: lm.y }, shiftedPolygon)
  ).length;

  return Math.round((insideCount / landmarks.length) * 100);
}

/**
 * getLandmarkStatus()
 * Returns landmark pixel coords with inside/outside flag — used by scoring.js to draw dots.
 */
export function getLandmarkStatus(canvasWidth, canvasHeight) {
  const landmarks = getScoredLandmarks(canvasWidth, canvasHeight);

  const shiftedPolygon = getMirroredPolygon(canvasWidth).map((pt) => ({
    x: pt.x + wallOffsetX,
    y: pt.y,
  }));

  return landmarks.map((lm) => ({
    x:      lm.x,
    y:      lm.y,
    inside: pointInPolygon({ x: lm.x, y: lm.y }, shiftedPolygon),
  }));
}

// ── GEOMETRY HELPER ──
// Ray-casting algorithm: determines if a point is inside a polygon
function pointInPolygon(point, polygon) {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// --- POLYGON CUTOUT X-coord mirroring ---
// In wall.js — mirror the polygon X coords against canvas width
function getMirroredPolygon(canvasWidth) {
  return activeCutout.polygon.map((pt) => ({
    x: canvasWidth - pt.x, // 👈 flip X
    y: pt.y,
  }));
}