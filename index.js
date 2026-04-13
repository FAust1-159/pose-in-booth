const howToPlayButton = document.getElementById("howToPlayButton");
const howToPlayModal = document.getElementById("howToPlayModal");
const closeHowToPlay = document.getElementById("closeHowToPlay");
const howToPlayDone = document.getElementById("howToPlayDone");

function openHowToPlay() {
  howToPlayModal.classList.remove("hidden");
}

function closeHowToPlayModal() {
  howToPlayModal.classList.add("hidden");
}

howToPlayButton.addEventListener("click", openHowToPlay);
closeHowToPlay.addEventListener("click", closeHowToPlayModal);
howToPlayDone.addEventListener("click", closeHowToPlayModal);
