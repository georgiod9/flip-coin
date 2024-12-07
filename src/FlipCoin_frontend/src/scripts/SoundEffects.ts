import clickSound from '../assets/sounds/click-15167.mp3';
import coinSound from "../assets/sounds/coins-sound-effect-1.mp3";
import thudSound from "../assets/sounds/thud-45719.mp3";
import whooshSound from "../assets/sounds/whoosh-vortex-243128.mp3";

const playSound = (soundFile: string) => {
    const audio = new Audio(soundFile);
    audio.play();
};

export const playSoundEffects = {
    click: () => playSound(clickSound),
    betWin: () => playSound(coinSound),
    betLose: () => playSound(thudSound),
    transfer: () => playSound(whooshSound),
};