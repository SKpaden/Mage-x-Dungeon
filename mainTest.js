import TestScene from './testScenes/TestScene.js';
import TestSceneA from './testScenes/TestSceneA.js';
import TestSceneB from './testScenes/TestSceneB.js';

var config = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.RESIZE,
            width: '100%',
            height: '100%'
        },
        parent: "canvas-parent",
        dom: {
        createContainer: true
        },
        // scene: [TestScene]
        scene: [TestSceneA, TestSceneB]
    }

var game = new Phaser.Game(config);