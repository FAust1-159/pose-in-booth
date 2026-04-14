// ══════════════════════════════════════════
// camera.js — getUserMedia camera setup
// Dev Overlaps: Amelia & Fergus
// ══════════════════════════════════════════

const video           = document.getElementById('video');
const compositeCanvas = document.getElementById('composite-canvas');
const landmarkCanvas  = document.getElementById('landmark-canvas');

export let ctx;          // composite canvas context
export let lmCtx;        // landmark canvas context
export let videoStream;  // raw MediaStream (used by recorder)

export async function initCamera() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        // camera resolution
        width:       { ideal: 1280 },
        height:      { ideal: 720 },
        facingMode:  'user',       // front-facing camera
      },
      audio: false,
    });

    video.srcObject = videoStream;

    // Wait for video metadata to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();

        // Match canvas dimensions to video
        const w = video.videoWidth;
        const h = video.videoHeight;

        compositeCanvas.width  = w;
        compositeCanvas.height = h;
        landmarkCanvas.width   = w;
        landmarkCanvas.height  = h;

        ctx   = compositeCanvas.getContext('2d');
        lmCtx = landmarkCanvas.getContext('2d');

        resolve();
      };
    });

    console.log('[Camera] Ready:', video.videoWidth, 'x', video.videoHeight);

  } catch (err) {
    console.error('[Camera] Failed to access camera:', err);
    alert('Could not access the camera. Please allow camera permissions and reload.');
  }
}
