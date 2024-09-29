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

// Start background music
export function startBackgroundMusic(music) {
    music.play().catch(error => {
        console.log("Audio play failed:", error);
        document.addEventListener('click', () => {
            music.play().catch(e => console.log("Audio play failed again:", e));
        }, { once: true });
    });
}

// **New: Export launchSound**
export const launchSound = new Audio('/static/audio/drop.mp3');

// **New: Export mergeSound**
export const mergeSound = new Audio('/static/audio/merge.mp3');

export const gameOver = new Audio('/static/audio/gameover.mp3')