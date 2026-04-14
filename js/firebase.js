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
  apiKey: "AIzaSyDZ938flIWioajlKMJILTgENlvpusotA4o",
  authDomain: "pose-in-booth-grp2.firebaseapp.com",
  projectId: "pose-in-booth-grp2",
  storageBucket: "pose-in-booth-grp2.firebasestorage.app",
  messagingSenderId: "213893343455",
  appId: "1:213893343455:web:ce27c6eae19a21702ee16a",
  measurementId: "G-593E740WWT"
};

firebase.initializeApp(firebaseConfig);


export const db      = firebase.firestore();
export const storage = firebase.storage();

// ── COLLECTION REFERENCE ──
// All recording metadata is stored under "recordings"
export const recordingsCol = db.collection('recordings');
