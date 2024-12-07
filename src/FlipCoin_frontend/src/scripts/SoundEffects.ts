import clickSound from '../assets/sounds/click-15167.mp3';
import coinSound from "../assets/sounds/coins-sound-effect-1.mp3";
import thudSound from "../assets/sounds/thud-45719.mp3";
import whooshSound from "../assets/sounds/whoosh-vortex-243128.mp3";

const playSound = (soundFile: string, duration?: number) => {
    const audio = new Audio(soundFile);
    audio.play();
    if (duration) {
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, duration * 1000);
    }
};

export const playSoundEffects = {
    click: () => playSound(clickSound),
    betWin: () => playSound(coinSound),
    betLose: () => playSound(thudSound),
    transfer: () => playSound(whooshSound, 2),
};