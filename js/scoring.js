// ══════════════════════════════════════════
// scoring.js — Live accuracy + landmark dots
// Dev: Fergus
// ══════════════════════════════════════════

import { lmCtx } from './camera.js';
import { calculateAccuracy, getLandmarkStatus, isWallAnimating } from './wall.js';

const PASS_THRESHOLD = 75; // % required to pass

// Shared live accuracy value (read by recorder.js for final score)
export let liveAccuracy = 0;

/**
 * updateScoring()
 * Called every render frame.
 * - Always calculates accuracy (even during wall animation — for participant monitor)
 * - Only draws landmark dots after wall finishes animating in
 */
export function updateScoring(canvas) {
  const w = canvas.width;
  const h = canvas.height;

  // Always calculate score
  liveAccuracy = calculateAccuracy(w, h);

  // Update HUD accuracy display
  const display = document.getElementById('accuracy-value');
  if (display) {
    display.textContent = `${liveAccuracy}%`;
    display.style.color = liveAccuracy >= PASS_THRESHOLD
      ? 'var(--clr-success)'
      : 'var(--clr-accent)';
  }

  // Only draw dots once wall is fully in position
  if (isWallAnimating()) return;

  drawLandmarkDots(w, h);
}

function drawLandmarkDots(w, h) {
  lmCtx.clearRect(0, 0, w, h);

  const statuses = getLandmarkStatus(w, h);

  statuses.forEach(({ x, y, inside }) => {
    lmCtx.beginPath();
    lmCtx.arc(x, y, 8, 0, Math.PI * 2);
    lmCtx.fillStyle   = inside ? 'rgba(46,213,115,0.85)' : 'rgba(255,71,87,0.85)';
    lmCtx.strokeStyle = '#fff';
    lmCtx.lineWidth   = 2;
    lmCtx.fill();
    lmCtx.stroke();
  });
}

export function isPassing() {
  return liveAccuracy >= PASS_THRESHOLD;
}
