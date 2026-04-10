// ══════════════════════════════════════════
// recorder.js — MediaRecorder video capture
// Dev: Genesis
// ══════════════════════════════════════════

import { videoStream }           from './camera.js';
import { storage, recordingsCol } from './firebase.js';
import { liveAccuracy }           from './scoring.js';

let mediaRecorder = null;
let chunks        = [];
export let isRecording = false;

export function initRecorder() {
  console.log('[Recorder] Ready.');
}

/**
 * startRecording()
 * Begins recording the composite canvas stream.
 * Call this when the operator triggers the session (before countdown).
 */
export function startRecording(compositeCanvas) {
  chunks = [];

  // Combine canvas video track with optional audio (no mic needed for booth)
  const canvasStream = compositeCanvas.captureStream(30); // 30fps

  // Optional: add audio track from microphone or a background music node
  // const audioCtx = new AudioContext();
  // canvasStream.addTrack(audioTrack);

  const mimeType = getSupportedMimeType();

  mediaRecorder = new MediaRecorder(canvasStream, { mimeType });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start(100); // collect data every 100ms
  isRecording = true;
  console.log('[Recorder] Started. MimeType:', mimeType);
}

/**
 * stopAndSave()
 * Stops recording, builds the video blob, uploads to Firebase.
 * Returns a promise that resolves with the download URL.
 */
export function stopAndSave() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      reject(new Error('Recorder not active.'));
      return;
    }

    mediaRecorder.onstop = async () => {
      isRecording = false;

      const mimeType = getSupportedMimeType();
      const blob = new Blob(chunks, { type: mimeType });
      const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';

      try {
        const url = await uploadToFirebase(blob, ext);
        resolve(url);
      } catch (err) {
        reject(err);
      }
    };

    mediaRecorder.stop();
    console.log('[Recorder] Stopped.');
  });
}

async function uploadToFirebase(blob, ext) {
  const filename  = `recordings/${Date.now()}.${ext}`;
  const storageRef = storage.ref(filename);

  console.log('[Recorder] Uploading to Firebase Storage...');
  const snapshot = await storageRef.put(blob);
  const url      = await snapshot.ref.getDownloadURL();

  // Save metadata to Firestore
  await recordingsCol.add({
    videoUrl:  url,
    filename,
    accuracy:  liveAccuracy,
    passed:    liveAccuracy >= 75,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  console.log('[Recorder] Saved. URL:', url);
  return url;
}

// ── MIME TYPE HELPER ──
function getSupportedMimeType() {
  const types = [
    'video/mp4;codecs=avc1',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}
