// ══════════════════════════════════════════
// collections.js — Saved recordings management
// Dev Overlaps: Amelia & Genesis
// ══════════════════════════════════════════

import { recordingsCol, storage } from './firebase.js';

let pendingDeleteId  = null;
let pendingDeleteRef = null;

export async function initCollections() {
  await loadRecordings();
  bindModalEvents();
}

// ── LOAD & RENDER ──
async function loadRecordings() {
  const loadingEl = document.getElementById('collections-loading');
  const emptyEl   = document.getElementById('collections-empty');
  const gridEl    = document.getElementById('video-grid');
  const countEl   = document.getElementById('collections-count');

  try {
    const snapshot = await recordingsCol
      .orderBy('createdAt', 'desc')
      .get();

    loadingEl.classList.add('hidden');

    if (snapshot.empty) {
      emptyEl.classList.remove('hidden');
      return;
    }

    countEl.textContent = `${snapshot.size} video${snapshot.size !== 1 ? 's' : ''}`;
    gridEl.classList.remove('hidden');
    gridEl.innerHTML = '';

    snapshot.forEach((doc) => {
      const data = doc.data();
      gridEl.appendChild(buildCard(doc.id, data));
    });

  } catch (err) {
    console.error('[Collections] Failed to load:', err);
    loadingEl.innerHTML = '<p>Failed to load recordings. Check your connection.</p>';
  }
}

function buildCard(id, data) {
  const date = data.createdAt?.toDate
    ? data.createdAt.toDate().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : 'Unknown date';

  const card = document.createElement('div');
  card.className    = 'video-card';
  card.dataset.id   = id;
  card.dataset.url  = data.videoUrl;
  card.dataset.file = data.filename || '';

  card.innerHTML = `
    <div class="video-thumb" data-action="replay">
      <video src="${data.videoUrl}" preload="metadata" muted></video>
    </div>
    <div class="video-info">
      <span class="video-date">${date}</span>
      <span class="video-score">${data.accuracy ?? '--'}%</span>
    </div>
    <div class="video-actions">
      <button class="btn-action btn-replay"   data-action="replay">▶ Replay</button>
      <button class="btn-action btn-download" data-action="download">⬇ Save</button>
      <button class="btn-action btn-delete"   data-action="delete">🗑 Delete</button>
    </div>
  `;

  card.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    switch (action) {
      case 'replay':   openPlayer(data.videoUrl);           break;
      case 'download': downloadVideo(data.videoUrl, date);  break;
      case 'delete':   confirmDelete(id, data.filename);    break;
    }
  });

  return card;
}

// ── REPLAY ──
function openPlayer(url) {
  const modal    = document.getElementById('player-modal');
  const playerVid = document.getElementById('player-video');
  playerVid.src  = url;
  modal.classList.remove('hidden');
  playerVid.play();
}

function closePlayer() {
  const modal    = document.getElementById('player-modal');
  const playerVid = document.getElementById('player-video');
  playerVid.pause();
  playerVid.src = '';
  modal.classList.add('hidden');
}

// ── DOWNLOAD ──
function downloadVideo(url, label) {
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `posein-${label}.webm`;
  a.target   = '_blank';
  a.click();
}

// ── DELETE ──
function confirmDelete(docId, filename) {
  pendingDeleteId  = docId;
  pendingDeleteRef = filename;
  document.getElementById('delete-modal').classList.remove('hidden');
}

async function executeDelete() {
  if (!pendingDeleteId) return;

  try {
    // Delete from Firestore
    await recordingsCol.doc(pendingDeleteId).delete();

    // Delete from Storage
    if (pendingDeleteRef) {
      await storage.ref(pendingDeleteRef).delete();
    }

    // Remove card from DOM
    document.querySelector(`.video-card[data-id="${pendingDeleteId}"]`)?.remove();

    // Update count
    const remaining = document.querySelectorAll('.video-card').length;
    document.getElementById('collections-count').textContent =
      `${remaining} video${remaining !== 1 ? 's' : ''}`;

    if (remaining === 0) {
      document.getElementById('video-grid').classList.add('hidden');
      document.getElementById('collections-empty').classList.remove('hidden');
    }

  } catch (err) {
    console.error('[Collections] Delete failed:', err);
    alert('Could not delete the recording. Try again.');
  } finally {
    closeDeleteModal();
  }
}

function closeDeleteModal() {
  pendingDeleteId  = null;
  pendingDeleteRef = null;
  document.getElementById('delete-modal').classList.add('hidden');
}

// ── MODAL EVENT BINDINGS ──
function bindModalEvents() {
  document.getElementById('player-close')
    .addEventListener('click', closePlayer);
  document.getElementById('modal-backdrop')
    .addEventListener('click', closePlayer);

  document.getElementById('delete-confirm')
    .addEventListener('click', executeDelete);
  document.getElementById('delete-cancel')
    .addEventListener('click', closeDeleteModal);
  document.getElementById('delete-backdrop')
    .addEventListener('click', closeDeleteModal);
}
