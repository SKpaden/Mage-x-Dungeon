export default class GachaScene extends Phaser.Scene {
  constructor() { super({ key: 'gacha' }); }

  create() {
    // Player team (left side)
    this.add.text(150, 50, 'Your Team', { fontSize: '24px', fill: '#00ff00' });
    // Fake 5 heroes (replace with data-driven later)
    for (let i = 0; i < 5; i++) {
      const hero = this.add.rectangle(100 + i*100, 200, 80, 120, 0x6666ff).setInteractive();
      hero.on('pointerdown', () => this.selectHero(hero));  // Skill menu pops up
      this.add.text(100 + i*100, 180, `Hero ${i+1}`, { fontSize: '16px' }).setOrigin(0.5);
    }

    // Enemy team (right)
    this.add.text(950, 50, 'Enemies', { fontSize: '24px', fill: '#ff0000' });
    // Similar...

    // Battle log (bottom)
    this.logText = this.add.text(50, 650, 'Battle Start!\nTurn: Player Mage', {
      fontSize: '20px', fill: '#fff', wordWrap: { width: 1100 }
    });

    // Your BattleManager here (import from managers/)
    // this.battleManager = new BattleManager(this);  // Handles turns, calls this.log('Fireball! 50 dmg')
  }

  selectHero(hero) {
    this.logText.setText(this.logText.text + '\nSelected hero - choose skill!');
    // Popup skill buttons...
  }
}