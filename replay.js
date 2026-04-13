const replayTitle = document.getElementById("replayTitle");
const replayClipCount = document.getElementById("replayClipCount");
const replayDuration = document.getElementById("replayDuration");
const replayMode = document.getElementById("replayMode");
const replaySize = document.getElementById("replaySize");
const replayDate = document.getElementById("replayDate");
const replayAction = document.getElementById("replayAction");
const saveAction = document.getElementById("saveAction");
const deleteAction = document.getElementById("deleteAction");
const replayVideo = document.getElementById("replayVideo");
const replayMock = document.getElementById("replayMock");
const replayPreviewTrigger = document.getElementById("replayPreviewTrigger");

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

const params = new URLSearchParams(window.location.search);
const recordingId = params.get("id");
const recordings = readRecordings();
const fallbackRecording = {
  id: "preview-session",
  title: "Session #1",
  duration: "0:42",
  fileSize: "1.2 MB",
  createdAt: new Date().toISOString()
};
const selected = recordings.find((recording) => recording.id === recordingId) || recordings[0] || fallbackRecording;

replayClipCount.textContent = `${recordings.length} ${recordings.length === 1 ? "clip" : "clips"}`;

if (!recordings.length && !recordingId) {
  replayTitle.textContent = "Replay of Session #1";
  replayDuration.textContent = fallbackRecording.duration;
  replayMode.textContent = "Easy";
  replaySize.textContent = fallbackRecording.fileSize;
  replayDate.textContent = new Date(fallbackRecording.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
} else {
  replayTitle.textContent = `Replay of ${selected.title}`;
  replayDuration.textContent = selected.duration || "0:42";
  replayMode.textContent = "Easy";
  replaySize.textContent = selected.fileSize || "1.2 MB";
  replayDate.textContent = new Date(selected.createdAt || Date.now()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

  if (selected.videoUrl) {
    replayVideo.src = selected.videoUrl;
    replayVideo.classList.remove("hidden");
    replayMock.classList.add("hidden");
  }
}

replayAction.addEventListener("click", () => {
  if (selected?.videoUrl) {
    replayVideo.play();
    return;
  }

  window.alert(`Replay placeholder for ${selected?.title || "this session"}`);
});

replayPreviewTrigger.addEventListener("click", () => {
  replayAction.click();
});

saveAction.addEventListener("click", () => {
  downloadRecording(selected);
  showSaveModal(selected);
});

deleteAction.addEventListener("click", () => {
  showDeleteModal(selected, () => {
    writeRecordings(recordings.filter((recording) => recording.id !== selected.id));
    window.location.href = "collections.html";
  });
});
