// ══════════════════════════════════════════
// mediapipe.js — Pose detection via MediaPipe
// Dev: Fergus
// ══════════════════════════════════════════
//
// Uses: MediaPipe Tasks Vision JS SDK
// Docs: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker/web_js

// const { PoseLandmarker, FilesetResolver, DrawingUtils } = window;

export let poseLandmarker = null;

// Latest detected landmarks — updated every frame
export let currentLandmarks = [];

// Indices of landmarks used for scoring (major joints only)
// Full list: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
export const SCORED_INDICES = [
  0,        // nose
  11, 12,   // shoulders
  13, 14,   // elbows
  15, 16,   // wrists
  23, 24,   // hips
  25, 26,   // knees
  27, 28,   // ankles
];

// Minimum visibility score to include a landmark in scoring (0–1)
const MIN_VISIBILITY = 0.5;

export async function initMediaPipe() {
  const vision = await import(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs'
  );

  const { PoseLandmarker, FilesetResolver } = vision;

  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode:  'VIDEO',
    numPoses:     1,
    minPoseDetectionConfidence:  0.5,
    minPosePresenceConfidence:   0.5,
    minTrackingConfidence:       0.5,
  });

  console.log('[MediaPipe] PoseLandmarker ready.');
}

/**
 * detectPose()
 * Call this once per render frame, passing the current video element.
 * Updates currentLandmarks in place.
 */
export function detectPose(videoEl) {
  if (!poseLandmarker) return;

  const result = poseLandmarker.detectForVideo(videoEl, performance.now());

  if (result.landmarks && result.landmarks.length > 0) {
    // landmarks[0] = first detected person
    // Each landmark: { x, y, z, visibility } — x/y are 0..1 normalized
    currentLandmarks = result.landmarks[0];
  } else {
    currentLandmarks = [];
  }
}

/**
 * getScoredLandmarks()
 * Returns only the landmarks used for accuracy scoring,
 * filtered by visibility threshold, with pixel coordinates.
 */
export function getScoredLandmarks(canvasWidth, canvasHeight) {
  if (!currentLandmarks.length) return [];

  return SCORED_INDICES
    .map((i) => {
      const lm = currentLandmarks[i];
      if (!lm || lm.visibility < MIN_VISIBILITY) return null;
      return {
        x:          canvasWidth - (lm.x * canvasWidth), // flips x
        y:          lm.y * canvasHeight,
        visibility: lm.visibility,
        index:      i,
      };
    })
    .filter(Boolean);
}
