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

/**
 * Plays a one-time use text popup at a specified location for a certain duration.
 * @param {Phaser.Scene} scene The current Phaser scene object
 * @param {float} x The x coordinate
 * @param {float} y The y coordinate
 * @param {String} text The text to be displayed
 * @param {int} duration The duration of the tween in ms
 * @param {Object} textoptions Options for Phaser text objects
 */
export function showTextPopup(scene, x, y, text, duration, textoptions = {}){
    const phaserText = scene.add.text(x, y, text, textoptions).setOrigin(0.5);
    scene.tweens.add({
        targets: phaserText,
        // y: '-=50',
        alpha: 0,
        duration: duration,
        onComplete: () => phaserText.destroy()
    })
}