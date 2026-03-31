import BattleScene from "./scenes/BattleScene.js";
import MapScene from "./scenes/MapScene.js";
import TeamSelectScene from "./scenes/TeamSelectScene.js";

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
        // scene: [MapScene]
        scene: [TeamSelectScene, MapScene, BattleScene]
    }

var game = new Phaser.Game(config);