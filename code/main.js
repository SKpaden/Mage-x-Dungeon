import BattleScene from './scenes/BattleScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';

var config = {
        type: Phaser.AUTO,
        scale: {
            // mode: Phaser.Scale.FIT,
            // autoCenter: Phaser.Scale.CENTER_BOTH,
            mode: Phaser.Scale.RESIZE,
            width: '100%',
            height: '100%'
        },
        parent: "canvas-parent",
        dom: {
        createContainer: true
        },
        scene: [MainMenuScene, BattleScene]
    }

var game = new Phaser.Game(config);