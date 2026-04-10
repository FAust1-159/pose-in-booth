// ══════════════════════════════════════════
// animations.js — Countdown + result animations
// Dev Overlaps: Amelia & Fergus(?)
// ══════════════════════════════════════════
// All animations that need to appear in the final VIDEO
// are drawn here onto the composite canvas (ctx).
// UI-only overlays (not in video) are toggled in ui.js.

import { ctx } from './camera.js';

export function initAnimations() {
  console.log('[Animations] Ready.');
}

// ── COUNTDOWN ──
/**
 * playCountdown()
 * Draws 3 → 2 → 1 → GO onto the canvas.
 * Returns a promise that resolves when countdown finishes.
 */
export function playCountdown(canvas) {
  return new Promise((resolve) => {
    const steps    = ['3', '2', '1', 'GO!'];
    let   stepIdx  = 0;
    const duration = 900; // ms per number

    function drawStep() {
      if (stepIdx >= steps.length) {
        resolve();
        return;
      }

      const label    = steps[stepIdx];
      const progress = 0; // will animate via requestAnimationFrame
      const startTime = performance.now();

      function frame(now) {
        const elapsed  = now - startTime;
        const t        = Math.min(elapsed / duration, 1);
        const alpha    = 1 - t;                        // fade out
        const scale    = 1 + t * 0.3;                  // scale up
        const fontSize = Math.round(canvas.height * 0.25);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font        = `900 ${fontSize}px 'Bebas Neue', sans-serif`;
        ctx.fillStyle   = '#e8ff3b';
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';

        const cx = canvas.width  / 2;
        const cy = canvas.height / 2;

        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.fillText(label, 0, 0);
        ctx.restore();

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          stepIdx++;
          drawStep();
        }
      }

      requestAnimationFrame(frame);
    }

    drawStep();
  });
}

// ── CONGRATULATORY ANIMATION ──
/**
 * playCongratsAnimation()
 * Draws a celebratory burst of confetti particles on the canvas.
 * Runs for ~2 seconds then resolves.
 */
export function playCongratsAnimation(canvas) {
  return new Promise((resolve) => {
    const particles = Array.from({ length: 80 }, () => ({
      x:    Math.random() * canvas.width,
      y:    Math.random() * canvas.height * 0.5,
      vx:   (Math.random() - 0.5) * 6,
      vy:   Math.random() * 4 + 2,
      size: Math.random() * 10 + 4,
      color: ['#e8ff3b', '#2ed573', '#ff4757', '#fff', '#70a1ff'][
        Math.floor(Math.random() * 5)
      ],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
    }));

    const startTime = performance.now();
    const duration  = 2000;

    function frame(now) {
      const elapsed = now - startTime;
      const t       = elapsed / duration;

      particles.forEach((p) => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.15;           // gravity
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

// ── FAIL ANIMATION ──
/**
 * playFailAnimation()
 * Flashes the screen red briefly. Runs for ~1.2s then resolves.
 */
export function playFailAnimation(canvas) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const duration  = 1200;
    const flashes   = 3;

    function frame(now) {
      const elapsed = now - startTime;
      const t       = elapsed / duration;
      const phase   = Math.sin(t * Math.PI * flashes * 2);

      if (phase > 0) {
        ctx.save();
        ctx.globalAlpha = phase * 0.45;
        ctx.fillStyle   = '#ff4757';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}
