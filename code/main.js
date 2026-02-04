import BattleScene from './scenes/BattleScene.js';

var config = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.SCALE,
            width: '100%',
            height: '100%'
        },
        scene: [BattleScene]
    }

var game = new Phaser.Game(config);