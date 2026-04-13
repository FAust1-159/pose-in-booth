const collectionsList = document.getElementById("collectionsList");
const clipCount = document.getElementById("clipCount");

function readRecordings() {
  return JSON.parse(localStorage.getItem("ar-recordings") || "[]");
}

function writeRecordings(recordings) {
  localStorage.setItem("ar-recordings", JSON.stringify(recordings));
}

function downloadRecording(recording) {
  const blob = new Blob([JSON.stringify(recording, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${recording.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDeleteLabel(recording) {
  return `${recording.title} · ${recording.duration || "0:42"} · Easy`;
}

function closeModal() {
  document.querySelector(".modal-overlay")?.remove();
}

function showSaveModal(recording) {
  closeModal();
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card modal-save">
      <div class="modal-icon success-icon">
        <span></span>
      </div>
      <h2 class="modal-title success-text">Saved!</h2>
      <p class="modal-copy">${recording.title} has been saved!</p>
      <button class="modal-button modal-done" type="button">Done</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector(".modal-done").addEventListener("click", closeModal);
}

function showDeleteModal(recording, onConfirm) {
  closeModal();
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card modal-delete">
      <div class="modal-trash-icon">
        <span class="trash-lid"></span>
        <span class="trash-bin"></span>
      </div>
      <h2 class="modal-title danger-text">Delete this clip?</h2>
      <p class="modal-copy modal-copy-strong">${formatDeleteLabel(recording)}</p>
      <div class="modal-actions">
        <button class="modal-button modal-cancel" type="button">Cancel</button>
        <button class="modal-button modal-confirm" type="button">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector(".modal-cancel").addEventListener("click", closeModal);
  overlay.querySelector(".modal-confirm").addEventListener("click", () => {
    closeModal();
    onConfirm();
  });
}

function renderCollections() {
  const recordings = readRecordings();
  clipCount.textContent = `${recordings.length} ${recordings.length === 1 ? "clip" : "clips"}`;

  if (!recordings.length) {
    collectionsList.innerHTML = `
      <article class="collection-item empty-collection-card">
        <div class="collection-preview preview-trigger" data-empty-replay="true" aria-label="Open replay preview">
          <span class="preview-play"></span>
        </div>
        <div class="collection-title" data-empty-replay="true">No saved clips yet</div>
        <div class="collection-meta">
          <span class="meta-pill">Empty</span>
        </div>
        <div class="collection-actions">
          <button class="collection-action" type="button" data-action="empty-replay" aria-label="Replay preview"><img class="action-icon" src="./PSBimg/play.png" alt="Replay"></button>
          <button class="collection-action" type="button" data-action="empty-save" aria-label="Save preview"><img class="action-icon" src="./PSBimg/upload-simple.png" alt="Download"></button>
          <button class="collection-action" type="button" data-action="empty-delete" aria-label="Delete preview"><img class="action-icon" src="./PSBimg/trash.png" alt="Delete"></button>
        </div>
      </article>
    `;
    return;
  }

  collectionsList.innerHTML = recordings.map((recording) => `
    <article class="collection-item" data-id="${recording.id}">
      <div class="collection-preview preview-trigger" aria-label="Open replay for ${recording.title}">
        <span class="preview-badge">April 13</span>
        <span class="preview-play"></span>
        <span class="preview-duration">${recording.duration || "0:12"}</span>
      </div>
      <div class="collection-title">${recording.title}</div>
      <div class="collection-meta">
        <span class="meta-pill">Easy</span>
        <span class="meta-pill">${recording.accuracy}%</span>
        <span class="meta-pill">${recording.cutout}</span>
      </div>
      <div class="collection-actions">
        <button class="collection-action" type="button" data-action="replay" aria-label="Replay"><img class="action-icon" src="./PSBimg/play.png" alt="Replay"></button>
        <button class="collection-action" type="button" data-action="download" aria-label="Download"><img class="action-icon" src="./PSBimg/upload-simple.png" alt="Download"></button>
        <button class="collection-action" type="button" data-action="delete" aria-label="Delete"><img class="action-icon" src="./PSBimg/trash.png" alt="Delete"></button>
      </div>
    </article>
  `).join("");
}

collectionsList.addEventListener("click", (event) => {
  const card = event.target.closest(".collection-item");
  const button = event.target.closest("button[data-action]");
  const emptyReplayTrigger = event.target.closest("[data-empty-replay='true']");

  if (button?.dataset.action === "empty-replay" || emptyReplayTrigger) {
    window.location.href = "replay.html";
    return;
  }

  if (button?.dataset.action === "empty-save") {
    showSaveModal({ title: "Session #1" });
    return;
  }

  if (button?.dataset.action === "empty-delete") {
    showDeleteModal(
      { title: "Session #1", duration: "0:42" },
      () => {}
    );
    return;
  }

  if (!card) {
    return;
  }

  const id = card.dataset.id;
  const recordings = readRecordings();
  const selected = recordings.find((recording) => recording.id === id);

  if (!selected) {
    return;
  }

  if (!button) {
    window.location.href = `replay.html?id=${encodeURIComponent(id)}`;
    return;
  }

  if (button.dataset.action === "delete") {
    showDeleteModal(selected, () => {
      writeRecordings(recordings.filter((recording) => recording.id !== id));
      renderCollections();
    });
    return;
  }

  if (button.dataset.action === "download") {
    downloadRecording(selected);
    showSaveModal(selected);
    return;
  }

  if (button.dataset.action === "replay") {
    window.location.href = `replay.html?id=${encodeURIComponent(id)}`;
  }
});

renderCollections();
