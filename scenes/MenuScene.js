export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'menu' });  // Unique ID for switching
  }

  preload() {
    this.load.image('background', 'resources/static/images/background.jpg');
    this.load.image('fire-mage', 'resources/static/images/Draconoid - Dark Mage.jpg');
  }

  create() {
    // Background:
    this.add.image(visualViewport.width/2, visualViewport.height/2, 'background').setScale(1.5);

    // Title:
    this.add.text(visualViewport.width/2, 120, 'Mage x Dungeon (MxD)', {
      fontSize: '48px', fill: '#690000', fontFamily: 'Arial Black'
    }).setOrigin(0.5);

    // Buttons (using Phaser rectangles + text for simplicity; images later):
    const startBattleBtn = this.add.rectangle(visualViewport.width/2, 350, 300, 80, 0x141414).setInteractive();
    startBattleBtn.on('pointerdown', () => this.scene.start('battle'));  // <- switch scenes!
    this.add.text(visualViewport.width/2, 350, 'Start Battle', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

    const gachaBtn = this.add.rectangle(visualViewport.width/2, 450, 300, 80, 0x141414).setInteractive();
    gachaBtn.on('pointerdown', () => this.scene.start('gacha'));
    this.add.text(visualViewport.width/2, 450, 'Pull Shards', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

    // Add portrait as teaser:
    this.add.image(visualViewport.width/8, visualViewport.height- 300, 'fire-mage').setScale(0.5);
  }
}