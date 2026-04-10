// ══════════════════════════════════════════
// firebase.js — Firebase init & exports
// Dev: Genesis
// ══════════════════════════════════════════
//
// TODO: Replace the config values below with
// your actual Firebase project credentials.
// Get them from: Firebase Console → Project Settings → Your Apps
//

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

firebase.initializeApp(firebaseConfig);

export const db      = firebase.firestore();
export const storage = firebase.storage();

// ── COLLECTION REFERENCE ──
// All recording metadata is stored under "recordings"
export const recordingsCol = db.collection('recordings');
