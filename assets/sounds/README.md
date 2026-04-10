# Sounds (Optional)

Place sound effect or background music files here.

## Suggested Files
- `countdown-beep.mp3`  — plays on each countdown number
- `success.mp3`         — plays on congratulatory result
- `fail.mp3`            — plays on failed result
- `bg-music.mp3`        — optional ambient loop during session

## Usage
Wire these up in `js/animations.js` using the Web Audio API
or a simple `new Audio('assets/sounds/success.mp3').play()` call.

Note: Browser autoplay policies may require a user interaction
(like the capture button press) before audio can play.
