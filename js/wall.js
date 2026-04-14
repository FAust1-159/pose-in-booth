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
  { x: 633, y: 183 }, { x: 486, y: 179 }, { x: 406, y: 300 },
  { x: 446, y: 332 }, { x: 524, y: 234 }, { x: 595, y: 246 },
  { x: 462, y: 518 }, { x: 356, y: 592 }, { x: 354, y: 685 },
  { x: 401, y: 695 }, { x: 413, y: 634 }, { x: 516, y: 559 },
  { x: 576, y: 449 }, { x: 691, y: 517 }, { x: 648, y: 653 },
  { x: 764, y: 713 }, { x: 723, y: 635 }, { x: 768, y: 481 },
  { x: 644, y: 412 }, { x: 697, y: 304 }, { x: 770, y: 385 },
  { x: 904, y: 297 }, { x: 871, y: 255 }, { x: 778, y: 314 },
  { x: 720, y: 227 }, { x: 816, y: 168 }, { x: 803, y: 71 },
  { x: 722, y: 30 },  { x: 627, y: 81 },
  // { x: 633, y: 183 }, for "closing" the polygon 
];

let cutoutEasy2 = [
  { x: 568, y: 168 }, { x: 382, y: 98 },  { x: 351, y: 171 },
  { x: 558, y: 277 }, { x: 567, y: 414 }, { x: 503, y: 626 },
  { x: 644, y: 693 }, { x: 689, y: 629 }, { x: 626, y: 594 },
  { x: 677, y: 459 }, { x: 855, y: 516 }, { x: 933, y: 352 },
  { x: 867, y: 325 }, { x: 829, y: 390 }, { x: 723, y: 350 },
  { x: 718, y: 258 }, { x: 911, y: 177 }, { x: 871, y: 95 },
  { x: 675, y: 175 }, { x: 708, y: 93 },  { x: 641, y: 17 },
  { x: 541, y: 70 }
]

let cutoutEasy3 = [
  { x: 473, y: 189 }, { x: 470, y: 379 }, { x: 516, y: 500 },
  { x: 445, y: 628 }, { x: 532, y: 690 }, { x: 641, y: 498 },
  { x: 659, y: 640 }, { x: 770, y: 648 }, { x: 742, y: 438 },
  { x: 611, y: 368 }, { x: 611, y: 308 }, { x: 799, y: 387 },
  { x: 829, y: 334 }, { x: 611, y: 243 }, { x: 610, y: 207 },
  { x: 825, y: 155 }, { x: 815, y: 100 }, { x: 616, y: 140 },
  { x: 607, y: 66 },  { x: 510, y: 22 },  { x: 438, y: 103 }
]

let cutoutEasy4 = [
  { x: 587, y: 190 }, { x: 542, y: 206 }, { x: 480, y: 293 },
  { x: 397, y: 175 }, { x: 334, y: 189 }, { x: 464, y: 411 },
  { x: 546, y: 361 }, { x: 456, y: 694 }, { x: 585, y: 686 },
  { x: 646, y: 508 }, { x: 726, y: 687 }, { x: 844, y: 696 },
  { x: 726, y: 343 }, { x: 821, y: 411 }, { x: 975, y: 194 },
  { x: 898, y: 177 }, { x: 811, y: 290 }, { x: 716, y: 200 },
  { x: 674, y: 192 }, { x: 725, y: 103 }, { x: 635, y: 17 },
  { x: 537, y: 106 }
]

let cutoutEasy5 = [
  { x: 555, y: 180 }, { x: 347, y: 147 }, { x: 336, y: 206 },
  { x: 568, y: 244 }, { x: 571, y: 397 }, { x: 563, y: 440 },
  { x: 620, y: 481 }, { x: 490, y: 542 }, { x: 515, y: 632 },
  { x: 668, y: 571 }, { x: 641, y: 650 }, { x: 731, y: 687 },
  { x: 795, y: 500 }, { x: 761, y: 425 }, { x: 698, y: 392 },
  { x: 704, y: 253 }, { x: 941, y: 209 }, { x: 929, y: 152 },
  { x: 704, y: 192 }, { x: 720, y: 122 }, { x: 654, y: 53 },
  { x: 561, y: 91 }
]

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
  {
    id:      'tiptoe',
    label:   'Tiptoe',
    imgSrc:  'assets/cutouts/easy_2.png',
    polygon: cutoutEasy2,
  },
  {
    id:      'tada',
    label:   'Tadah',
    imgSrc:  'assets/cutouts/easy_3.png',
    polygon: cutoutEasy3,
  },
  {
    id:      'idunno',
    label:   'Idunno',
    imgSrc:  'assets/cutouts/easy_4.png',
    polygon: cutoutEasy4,
  },
  {
    id:      'cutesy',
    label:   'Cutesy',
    imgSrc:  'assets/cutouts/easy_5.png',
    polygon: cutoutEasy5,
  },
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
