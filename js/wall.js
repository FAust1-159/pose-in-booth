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

let cutoutMid1 = [
  { x: 547, y: 320 }, { x: 546, y: 447 }, { x: 343, y: 617 },
  { x: 415, y: 681 }, { x: 641, y: 495 }, { x: 859, y: 677 },
  { x: 934, y: 621 }, { x: 713, y: 432 }, { x: 716, y: 316 },
  { x: 885, y: 94 },  { x: 812, y: 41 },  { x: 726, y: 148 },
  { x: 632, y: 54 },  { x: 530, y: 148 }, { x: 441, y: 39 },
  { x: 367, y: 96 }
]

let cutoutMid2 = [
  { x: 544, y: 305 }, { x: 545, y: 690 }, { x: 632, y: 690 },
  { x: 637, y: 650 }, { x: 663, y: 648 }, { x: 793, y: 517 },
  { x: 722, y: 438 }, { x: 722, y: 285 }, { x: 817, y: 155 },
  { x: 673, y: 31 },  { x: 637, y: 77 },  { x: 741, y: 165 },
  { x: 708, y: 203 }, { x: 631, y: 134 }, { x: 563, y: 207 },
  { x: 532, y: 161 }, { x: 627, y: 84 },  { x: 584, y: 32 },
  { x: 460, y: 155 }
]

let cutoutMid3 = [
  { x: 731, y: 221 }, { x: 669, y: 288 }, { x: 522, y: 241 },
  { x: 411, y: 261 }, { x: 385, y: 206 }, { x: 336, y: 218 },
  { x: 376, y: 354 }, { x: 519, y: 337 }, { x: 664, y: 382 },
  { x: 643, y: 494 }, { x: 695, y: 609 }, { x: 646, y: 632 },
  { x: 667, y: 684 }, { x: 799, y: 632 }, { x: 735, y: 477 },
  { x: 758, y: 368 }, { x: 801, y: 329 }, { x: 856, y: 440 },
  { x: 921, y: 409 }, { x: 839, y: 234 }, { x: 908, y: 215 },
  { x: 911, y: 142 }, { x: 839, y: 111 }, { x: 793, y: 166 },
  { x: 726, y: 44 },  { x: 663, y: 77 }
]

let cutoutMid4 = [
  { x: 690, y: 134 }, { x: 636, y: 130 }, { x: 498, y: 276 },
  { x: 426, y: 309 }, { x: 345, y: 194 }, { x: 194, y: 194 },
  { x: 195, y: 261 }, { x: 263, y: 264 }, { x: 383, y: 446 },
  { x: 490, y: 412 }, { x: 469, y: 520 }, { x: 552, y: 686 },
  { x: 678, y: 685 }, { x: 682, y: 623 }, { x: 617, y: 614 },
  { x: 577, y: 527 }, { x: 641, y: 287 }, { x: 720, y: 397 },
  { x: 904, y: 447 }, { x: 966, y: 361 }, { x: 922, y: 326 },
  { x: 891, y: 361 }, { x: 767, y: 323 }, { x: 719, y: 243 },
  { x: 868, y: 307 }, { x: 1046, y: 283 }, { x: 1095, y: 203 },
  { x: 1038, y: 184 }, { x: 1024, y: 207 }, { x: 894, y: 222 },
  { x: 826, y: 190 }, { x: 848, y: 108 }, { x: 751, y: 49 }
]

let cutoutMid5 = [
  { x: 538, y: 122 }, { x: 594, y: 261 }, { x: 505, y: 279 },
  { x: 454, y: 496 }, { x: 546, y: 689 }, { x: 670, y: 637 },
  { x: 598, y: 476 }, { x: 617, y: 390 }, { x: 671, y: 379 },
  { x: 671, y: 510 }, { x: 749, y: 520 }, { x: 754, y: 313 },
  { x: 806, y: 243 }, { x: 733, y: 164 }, { x: 663, y: 203 },
  { x: 633, y: 139 }, { x: 693, y: 87 },  { x: 644, y: 35 }
]

let cutoutMid6 = [
  { x: 613, y: 214 }, { x: 618, y: 302 }, { x: 665, y: 444 },
  { x: 654, y: 560 }, { x: 678, y: 674 }, { x: 734, y: 660 },
  { x: 730, y: 612 }, { x: 778, y: 615 }, { x: 769, y: 539 },
  { x: 777, y: 403 }, { x: 740, y: 288 }, { x: 734, y: 178 },
  { x: 833, y: 160 }, { x: 844, y: 108 }, { x: 707, y: 49 },
  { x: 641, y: 31 },  { x: 598, y: 95 },  { x: 636, y: 153 },
  { x: 436, y: 191 }, { x: 450, y: 255 }
]

let cutoutHard1 = [
  { x: 613, y: 172 }, { x: 595, y: 266 }, { x: 462, y: 178 },
  { x: 452, y: 139 }, { x: 406, y: 130 }, { x: 402, y: 235 },
  { x: 507, y: 290 }, { x: 678, y: 466 }, { x: 680, y: 680 },
  { x: 756, y: 698 }, { x: 758, y: 475 }, { x: 778, y: 316 },
  { x: 808, y: 369 }, { x: 872, y: 340 }, { x: 780, y: 162 },
  { x: 803, y: 83 },  { x: 716, y: 21 },  { x: 625, y: 70 },
  { x: 633, y: 152 }
]

let cutoutHard2 = [
  { x: 574, y: 177 }, { x: 428, y: 283 }, { x: 285, y: 213 },
  { x: 202, y: 252 }, { x: 254, y: 287 }, { x: 442, y: 383 },
  { x: 547, y: 309 }, { x: 546, y: 448 }, { x: 491, y: 528 },
  { x: 613, y: 647 }, { x: 646, y: 576 }, { x: 615, y: 535 },
  { x: 659, y: 475 }, { x: 804, y: 556 }, { x: 767, y: 622 },
  { x: 825, y: 673 }, { x: 920, y: 512 }, { x: 758, y: 408 },
  { x: 758, y: 320 }, { x: 850, y: 383 }, { x: 1079, y: 239 },
  { x: 982, y: 203 }, { x: 860, y: 282 }, { x: 722, y: 181 },
  { x: 738, y: 91 },  { x: 656, y: 26 },  { x: 564, y: 95 }
]

let cutoutHard3 = [
  { x: 671, y: 143 }, { x: 493, y: 121 }, { x: 482, y: 189 },
  { x: 668, y: 227 }, { x: 663, y: 316 }, { x: 368, y: 248 },
  { x: 339, y: 197 }, { x: 315, y: 301 }, { x: 772, y: 405 },
  { x: 879, y: 502 }, { x: 799, y: 617 }, { x: 844, y: 665 },
  { x: 958, y: 495 }, { x: 817, y: 352 }, { x: 820, y: 259 },
  { x: 900, y: 327 }, { x: 956, y: 268 }, { x: 815, y: 144 },
  { x: 739, y: 31 }
]

let cutoutHard4 = [
  { x: 472, y: 39 },  { x: 484, y: 248 }, { x: 512, y: 307 },
  { x: 458, y: 470 }, { x: 515, y: 481 }, { x: 554, y: 383 },
  { x: 586, y: 398 }, { x: 617, y: 368 }, { x: 772, y: 440 },
  { x: 772, y: 696 }, { x: 848, y: 676 }, { x: 848, y: 251 },
  { x: 685, y: 112 }
]

let cutoutHard5 = [
  { x: 558, y: 149 }, { x: 365, y: 106 }, { x: 342, y: 183 },
  { x: 559, y: 248 }, { x: 550, y: 392 }, { x: 419, y: 491 },
  { x: 429, y: 568 }, { x: 407, y: 616 }, { x: 498, y: 587 },
  { x: 493, y: 527 }, { x: 635, y: 420 }, { x: 776, y: 539 },
  { x: 717, y: 632 }, { x: 769, y: 675 }, { x: 877, y: 518 },
  { x: 725, y: 372 }, { x: 733, y: 275 }, { x: 907, y: 321 },
  { x: 935, y: 242 }, { x: 713, y: 170 }, { x: 733, y: 94 },
  { x: 659, y: 28 },  { x: 564, y: 71 }
]

let cutoutHard6 = [
  { x: 550, y: 279 }, { x: 523, y: 314 }, { x: 567, y: 455 },
  { x: 627, y: 427 }, { x: 691, y: 491 }, { x: 668, y: 564 },
  { x: 484, y: 433 }, { x: 393, y: 453 }, { x: 549, y: 576 },
  { x: 512, y: 624 }, { x: 619, y: 628 }, { x: 871, y: 680 },
  { x: 902, y: 650 }, { x: 861, y: 345 }, { x: 713, y: 206 },
  { x: 862, y: 103 }, { x: 844, y: 30 },  { x: 630, y: 175 },
  { x: 575, y: 100 }, { x: 467, y: 119 }, { x: 450, y: 229 }
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
  {
    id:      'yippee',
    label:   'Yippee',
    imgSrc:  'assets/cutouts/mid_1.png',
    polygon: cutoutMid1,
  },
  {
    id:      'tutu',
    label:   'Ballerina',
    imgSrc:  'assets/cutouts/mid_2.png',
    polygon: cutoutMid2,
  },
  {
    id:      'drunk',
    label:   'Drunk',
    imgSrc:  'assets/cutouts/mid_3.png',
    polygon: cutoutMid3,
  },
  {
    id:      'push',
    label:   'Push',
    imgSrc:  'assets/cutouts/mid_4.png',
    polygon: cutoutMid4,
  },
  {
    id:      'drink',
    label:   'Drink',
    imgSrc:  'assets/cutouts/mid_5.png',
    polygon: cutoutMid5,
  },
  {
    id:      'emjey',
    label:   'MJ',
    imgSrc:  'assets/cutouts/mid_6.png',
    polygon: cutoutMid6,
  },
  {
    id:      'yoga',
    label:   'MJ',
    imgSrc:  'assets/cutouts/hard_1.png',
    polygon: cutoutHard1,
  },
  {
    id:      'frog',
    label:   'Frog',
    imgSrc:  'assets/cutouts/hard_2.png',
    polygon: cutoutHard2,
  },
  {
    id:      'kungfu',
    label:   'Kung Fu',
    imgSrc:  'assets/cutouts/hard_3.png',
    polygon: cutoutHard3,
  },
  {
    id:      'zombie',
    label:   'Zombie',
    imgSrc:  'assets/cutouts/hard_4.png',
    polygon: cutoutHard4,
  },
  {
    id:      'ibuprofen',
    label:   'Ibuprofen',
    imgSrc:  'assets/cutouts/hard_5.png',
    polygon: cutoutHard5,
  },
  {
    id:      'spike',
    label:   'Haikyuu',
    imgSrc:  'assets/cutouts/hard_6.png',
    polygon: cutoutHard6,
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
