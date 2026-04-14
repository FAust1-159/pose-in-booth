// ══════════════════════════════════════════
// ui.js — UI controller + master render loop
// Dev: Amelia
// ══════════════════════════════════════════

import { ctx }                                        from './camera.js';
import { detectPose }                                 from './mediapipe.js';
import { initWall, drawWall, triggerWall,
         setActiveCutout, CUTOUTS }                   from './wall.js';
import { updateScoring, isPassing, liveAccuracy }     from './scoring.js';
import { startRecording, stopAndSave }                from './recorder.js';
import { playCountdown, playCongratsAnimation,
         playFailAnimation }                          from './animations.js';

const video           = document.getElementById('video');
const compositeCanvas = document.getElementById('composite-canvas');
const landmarkCanvas  = document.getElementById('landmark-canvas');
const mirrorCanvas    = document.createElement('canvas');
const mirrorCtx       = mirrorCanvas.getContext('2d');

// Session state
let sessionActive = false;
let timerInterval = null;
let elapsedSecs   = 0;

// ── MASTER RENDER LOOP ──
// Runs every frame: composites all layers onto the canvas.
// MediaRecorder captures this canvas automatically.
function renderLoop() {
  if (!ctx) { requestAnimationFrame(renderLoop); return; }

  const w = compositeCanvas.width;
  const h = compositeCanvas.height;

  syncMirrorCanvasSize(w, h);

  // 1. Clear
  ctx.clearRect(0, 0, w, h);

  // 2. Camera feed (mirrored once, then reused for preview + detection)
  mirrorCtx.clearRect(0, 0, w, h);
  mirrorCtx.save();
  mirrorCtx.scale(-1, 1);
  mirrorCtx.drawImage(video, -w, 0, w, h);
  mirrorCtx.restore();
  ctx.drawImage(mirrorCanvas, 0, 0, w, h);

  // 3. MediaPipe detection
  detectPose(mirrorCanvas);

  // 4. Wall (drawn onto composite canvas so it appears in recording)
  drawWall(compositeCanvas);

  // 5. Scoring + landmark dots (drawn on separate landmark canvas — also composited)
  if (sessionActive) {
    updateScoring(compositeCanvas);

    // Composite the landmark canvas on top
    ctx.drawImage(landmarkCanvas, 0, 0);
  }

  requestAnimationFrame(renderLoop);
}

// ── INIT ──
export function initCameraUI() {
  populateCutoutGrid();
  bindCameraEvents();
  renderLoop();
  console.log('[UI] Camera UI ready.');
}

// ── SESSION FLOW ──
async function startSession() {
  if (sessionActive) return;

  const captureBtn = document.getElementById('capture-btn');
  captureBtn.disabled = true;
  sessionActive = true;

  // Start recording immediately
  startRecording(compositeCanvas);

  // Countdown (drawn on canvas — appears in video)
  const countdownOverlay = document.getElementById('countdown-overlay');
  countdownOverlay.classList.remove('hidden');
  await playCountdown(compositeCanvas);
  countdownOverlay.classList.add('hidden');

  // Start timer HUD
  elapsedSecs = 0;
  updateTimerDisplay(0);
  timerInterval = setInterval(() => {
    elapsedSecs++;
    updateTimerDisplay(elapsedSecs);
  }, 1000);

  // Trigger wall animation + simultaneous scoring
  triggerWall(compositeCanvas.width);

  // Wait for wall to fully arrive (based on wall speed + distance)
  // Wall travels full canvas width at wallSpeed px/frame @ 60fps
  // ~1280px / 6px * (1000/60)ms ≈ ~3.5s
  const wallTravelMs = (compositeCanvas.width / 6) * (1000 / 60);
  await wait(wallTravelMs);

  // Brief moment to let final accuracy settle (0.5s)
  await wait(500);

  // Stop timer
  clearInterval(timerInterval);

  // Play result animation (in canvas — appears in video)
  const passed = isPassing();
  if (passed) {
    await playCongratsAnimation(compositeCanvas);
  } else {
    await playFailAnimation(compositeCanvas);
  }

  // Stop recording + upload
  showResultOverlay(passed);
  try {
    await stopAndSave();
    document.querySelector('.result-saving').textContent = '✅ Saved to Collections!';
  } catch (err) {
    console.error('[UI] Save failed:', err);
    document.querySelector('.result-saving').textContent = '⚠️ Save failed. Try again.';
  }

  // Reset after 4s
  await wait(4000);
  resetSession();
}

function resetSession() {
  sessionActive = false;
  clearInterval(timerInterval);
  document.getElementById('result-overlay').classList.add('hidden');
  document.getElementById('capture-btn').disabled = false;
  document.getElementById('timer-value').textContent    = '--';
  document.getElementById('accuracy-value').textContent = '0%';
}

// ── TIMER DISPLAY ──
function updateTimerDisplay(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  document.getElementById('timer-value').textContent = `${m}:${s}`;
}

// ── RESULT OVERLAY ──
function showResultOverlay(passed) {
  const overlay = document.getElementById('result-overlay');
  document.getElementById('result-icon').textContent  = passed ? '🎉' : '😬';
  document.getElementById('result-title').textContent = passed ? 'You made it!' : 'So close!';
  document.getElementById('result-score').textContent = `Accuracy: ${liveAccuracy}%`;
  overlay.classList.remove('hidden');
}

// ── CUTOUT PICKER ──
function populateCutoutGrid() {
  const grid = document.getElementById('cutout-grid');
  grid.innerHTML = '';

  CUTOUTS.forEach((cutout, i) => {
    const item = document.createElement('div');
    item.className = 'cutout-item' + (i === 0 ? ' active' : '');
    item.innerHTML = `<img src="${cutout.imgSrc}" alt="${cutout.label}" onerror="this.style.display='none'" />
                      <span style="font-size:0.7rem;padding:4px;">${cutout.label}</span>`;
    item.addEventListener('click', () => {
      document.querySelectorAll('.cutout-item').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');
      setActiveCutout(cutout);
      closeCutoutPanel();
    });
    grid.appendChild(item);
  });
}

function openCutoutPanel()  { document.getElementById('cutout-panel').classList.remove('hidden'); }
function closeCutoutPanel() { document.getElementById('cutout-panel').classList.add('hidden'); }

// ── EVENT BINDINGS ──
function bindCameraEvents() {
  document.getElementById('capture-btn')
    .addEventListener('click', startSession);

  document.getElementById('cutout-btn')
    .addEventListener('click', openCutoutPanel());

  document.getElementById('cutout-close')
    .addEventListener('click', closeCutoutPanel);
}

// ── HELPER ──
function syncMirrorCanvasSize(w, h) {
  if (mirrorCanvas.width !== w) mirrorCanvas.width = w;
  if (mirrorCanvas.height !== h) mirrorCanvas.height = h;
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
