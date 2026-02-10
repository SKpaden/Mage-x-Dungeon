import BattleScene from './scenes/BattleScene.js';

var config = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: '100%',
            height: '100%'
        },
        parent: "canvas-parent",
        dom: {
        createContainer: true
        },
        scene: [BattleScene]
    }

var game = new Phaser.Game(config);