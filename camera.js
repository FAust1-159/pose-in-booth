const cameraFeed = document.getElementById("cameraFeed");
const overlayCanvas = document.getElementById("overlayCanvas");
const captureButton = document.getElementById("captureButton");
const toggleCutouts = document.getElementById("toggleCutouts");
const accuracyValue = document.getElementById("accuracyValue");
const timeValue = document.getElementById("timeValue");
const poseModal = document.getElementById("poseModal");
const closePoseModal = document.getElementById("closePoseModal");
const cancelPoseSelection = document.getElementById("cancelPoseSelection");
const confirmPoseSelection = document.getElementById("confirmPoseSelection");
const poseGrid = document.getElementById("poseGrid");
const poseFilters = document.querySelectorAll(".pose-filter");
const sessionCompleteModal = document.getElementById("sessionCompleteModal");
const finalAccuracyValue = document.getElementById("finalAccuracyValue");
const finalTimeValue = document.getElementById("finalTimeValue");
const finalPosesHitValue = document.getElementById("finalPosesHitValue");
const playAgainButton = document.getElementById("playAgainButton");
const countdownOverlay = document.getElementById("countdownOverlay");
const countdownValue = document.getElementById("countdownValue");

let timerId = null;
let countdownId = null;
let secondsElapsed = 0;
let simulatedAccuracy = 0;
let selectedCutout = "EASY1";
let pendingPose = "EASY1";
let activeFilter = "all";
let preStartCountdown = 0;
let posesHit = 0;

const poseOptions = [
  { id: "EASY1", label: "Pose 1", difficulty: "easy", image: "./PSBimg/EASY 1.png" },
  { id: "EASY2", label: "Pose 2", difficulty: "easy", image: "./PSBimg/EASY 2.png" },
  { id: "EASY3", label: "Pose 3", difficulty: "easy", image: "./PSBimg/EASY 3.png" },
  { id: "EASY4", label: "Pose 4", difficulty: "easy", image: "./PSBimg/EASY 4.png" },
  { id: "MEDIUM1", label: "Pose 5", difficulty: "medium", image: "./PSBimg/MEDIUM 1.png" },
  { id: "MEDIUM2", label: "Pose 6", difficulty: "medium", image: "./PSBimg/MEDIUM 2.png" },
  { id: "MEDIUM3", label: "Pose 7", difficulty: "medium", image: "./PSBimg/MEDIUM 3.png" },
  { id: "MEDIUM4", label: "Pose 8", difficulty: "medium", image: "./PSBimg/MEDIUM 4.png" },
  { id: "MEDIUM5", label: "Pose 9", difficulty: "medium", image: "./PSBimg/MEDIUM 5.png" },
  { id: "MEDIUM6", label: "Pose 10", difficulty: "medium", image: "./PSBimg/MEDIUM 6.png" },
  { id: "HARD1", label: "Pose 11", difficulty: "hard", image: "./PSBimg/HARD 1.png" },
  { id: "HARD2", label: "Pose 12", difficulty: "hard", image: "./PSBimg/HARD 2.png" },
  { id: "HARD3", label: "Pose 13", difficulty: "hard", image: "./PSBimg/HARD 3.png" },
  { id: "HARD4", label: "Pose 14", difficulty: "hard", image: "./PSBimg/HARD 4.png" },
  { id: "HARD5", label: "Pose 15", difficulty: "hard", image: "./PSBimg/HARD 5.png" },
  { id: "HARD6", label: "Pose 16", difficulty: "hard", image: "./PSBimg/HARD 6.png" }
];

function formatTime(value) {
  const minutes = String(Math.floor(value / 60)).padStart(2, "0");
  const seconds = String(value % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function saveMockRecording(score) {
  const recordings = JSON.parse(localStorage.getItem("ar-recordings") || "[]");
  recordings.unshift({
    id: crypto.randomUUID(),
    title: `Session ${new Date().toLocaleString()}`,
    accuracy: score,
    duration: formatTime(secondsElapsed),
    cutout: selectedCutout,
    posesHit,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem("ar-recordings", JSON.stringify(recordings.slice(0, 12)));
}

function showSessionComplete(score) {
  finalAccuracyValue.textContent = `${score}%`;
  finalTimeValue.textContent = formatTime(secondsElapsed);
  finalPosesHitValue.textContent = String(posesHit);
  sessionCompleteModal.classList.remove("hidden");
}

function stopSession() {
  clearInterval(timerId);
  timerId = null;
  captureButton.textContent = "Capture";
  saveMockRecording(simulatedAccuracy);
  showSessionComplete(simulatedAccuracy);
}

function beginLiveSession() {
  sessionCompleteModal.classList.add("hidden");
  secondsElapsed = 0;
  simulatedAccuracy = 0;
  posesHit = 0;
  timeValue.textContent = "00:00";
  accuracyValue.textContent = "0%";
  captureButton.textContent = "Finish";

  timerId = window.setInterval(() => {
    secondsElapsed += 1;
    simulatedAccuracy = Math.min(100, simulatedAccuracy + Math.floor(Math.random() * 19));
    posesHit = Math.min(20, posesHit + (Math.random() > 0.45 ? 1 : 0));
    timeValue.textContent = formatTime(secondsElapsed);
    accuracyValue.textContent = `${simulatedAccuracy}%`;

    if (secondsElapsed >= 10) {
      stopSession();
    }
  }, 1000);
}

function startSessionCountdown() {
  if (timerId || countdownId) {
    return;
  }

  sessionCompleteModal.classList.add("hidden");
  secondsElapsed = 0;
  simulatedAccuracy = 0;
  posesHit = 0;
  preStartCountdown = 3;
  timeValue.textContent = "00:00";
  accuracyValue.textContent = "0%";
  captureButton.textContent = "Get Ready";
  countdownValue.textContent = String(preStartCountdown);
  countdownOverlay.classList.remove("hidden");

  countdownId = window.setInterval(() => {
    preStartCountdown -= 1;

    if (preStartCountdown > 0) {
      countdownValue.textContent = String(preStartCountdown);
      return;
    }

    if (preStartCountdown === 0) {
      countdownValue.textContent = "Go";
      return;
    }

    clearInterval(countdownId);
    countdownId = null;
    countdownValue.textContent = "";
    countdownOverlay.classList.add("hidden");
    beginLiveSession();
  }, 1000);
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showResult(0);
    resultBanner.classList.remove("hidden");
    resultBanner.classList.add("fail");
    resultBanner.innerHTML = "<strong>Camera unavailable.</strong><p>Your browser does not support getUserMedia().</p>";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    cameraFeed.srcObject = stream;
    resizeOverlay();
  } catch (error) {
    resultBanner.classList.remove("hidden");
    resultBanner.classList.add("fail");
    resultBanner.innerHTML = "<strong>Camera blocked.</strong><p>Please allow camera access for this page.</p>";
    console.error(error);
  }
}

function renderPoseGrid() {
  const visiblePoses = poseOptions.filter((pose) => activeFilter === "all" || pose.difficulty === activeFilter);
  poseGrid.innerHTML = visiblePoses.map((pose) => `
    <button class="pose-card ${pose.id === pendingPose ? "selected" : ""}" type="button" data-pose-id="${pose.id}">
      <span class="pose-card-thumb">
        <img class="pose-card-image" src="${pose.image}" alt="${pose.label}">
      </span>
      <span class="pose-card-label">${pose.label}</span>
      <span class="pose-card-difficulty">${pose.difficulty}</span>
    </button>
  `).join("");
}

function openPoseModal() {
  pendingPose = selectedCutout;
  poseModal.classList.remove("hidden");
  renderPoseGrid();
}

function closePosePicker() {
  poseModal.classList.add("hidden");
}

function resizeOverlay() {
  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;
  const ctx = overlayCanvas.getContext("2d");

  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

toggleCutouts.addEventListener("click", openPoseModal);

closePoseModal.addEventListener("click", closePosePicker);
cancelPoseSelection.addEventListener("click", closePosePicker);

confirmPoseSelection.addEventListener("click", () => {
  selectedCutout = pendingPose;
  toggleCutouts.textContent = "Poses";
  closePosePicker();
});

poseFilters.forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    activeFilter = filterButton.dataset.filter || "all";
    poseFilters.forEach((button) => button.classList.toggle("active", button === filterButton));
    renderPoseGrid();
  });
});

poseGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-pose-id]");
  if (!card) {
    return;
  }

  pendingPose = card.dataset.poseId || "EASY1";
  renderPoseGrid();
});

playAgainButton.addEventListener("click", () => {
  sessionCompleteModal.classList.add("hidden");
  startSessionCountdown();
});

captureButton.addEventListener("click", () => {
  if (timerId) {
    stopSession();
    return;
  }

  if (countdownId) {
    return;
  }

  startSessionCountdown();
});

window.addEventListener("resize", resizeOverlay);

startCamera();
renderPoseGrid();
