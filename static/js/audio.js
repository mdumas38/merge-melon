// audio.js

export function playSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(error => {
        console.log("Audio play failed:", error);
    });
}

export function toggleBackgroundMusic(music, muteButton) {
    music.muted = !music.muted;
    muteButton.textContent = music.muted ? 'Unmute Music' : 'Mute Music';
}