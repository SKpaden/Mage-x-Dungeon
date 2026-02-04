import MenuScene from './scenes/MenuScene.js';
import BattleScene from './scenes/BattleScene.js';
import GachaScene from './scenes/GachaScene.js';

const config = {
  type: Phaser.AUTO,
  scale: {
    //mode: Phaser.Scale.RESIZE,
    //autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
//   width: visualViewport.width,  // Wider for teams: player left, enemies right
//   height: visualViewport.height,
  //parent: 'game-container',
  backgroundColor: 'rgb(20, 20, 20)',  // Dark fantasy theme
  scene: [MenuScene, BattleScene, GachaScene]  // Auto-loads all; start with first
};

const game = new Phaser.Game(config);