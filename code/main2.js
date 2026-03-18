import MapScene from "./scenes/MapScene.js";

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
        scene: [MapScene]
    }

var game = new Phaser.Game(config);