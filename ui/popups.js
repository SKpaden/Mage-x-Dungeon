import { uiStats } from "./uiStats.js";

// Shows a negative effect popup (e.g., Increase cooldown).
export function showNegativePopup(scene, x, y, text){
    const phaserText = scene.add.text(x, y, text, uiStats.negativePopupOptions).setOrigin(0.5);
    scene.tweens.add({
        targets: phaserText,
        y: '-=100',
        alpha: 0,
        duration: uiStats.popupDuration,
        onComplete: () => phaserText.destroy()
    });
}

// Shows a positive effect popup (e.g., Resisted).
export function showPositivePopup(scene, x, y, text){
    const phaserText = scene.add.text(x, y, text, uiStats.positivePopupOptions).setOrigin(0.5);
    scene.tweens.add({
        targets: phaserText,
        y: '-=100',
        alpha: 0,
        duration: uiStats.popupDuration,
        onComplete: () => phaserText.destroy()
    });
}