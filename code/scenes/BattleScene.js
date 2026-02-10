import { initBattle, initEventListeners } from '../game/gameState.js';
import { advanceToNextTurn } from '../game/turnManager.js';
import { initBg, initMessage, initTurnText, initPortraitDims, initPortraitDimsWithScaleManager, updateText } from '../ui/helpers.js';
import { initCombatLog, logCombat } from '../ui/combatLog.js';

export default class BattleScene extends Phaser.Scene {
    constructor() { super({ key: 'battle' }); }
    // Load assets:
    preload() {  // works
        // Portraits:
        this.load.image('my-hero', 'assets/portraits/Draconoid - Dark Mage.jpg');
        this.load.image('hero2', 'assets/portraits/Dragon Queen - Blue.jpg');
        this.load.image('hero3', 'assets/portraits/Draconoid - Warrior.jpg');
        this.load.image('hero4', 'assets/portraits/Dragon Queen - Poison.jpg');
        this.load.image('hero5', 'assets/portraits/Draconoid - Necromancer.jpg');

        // SKills:
        this.load.image('Dark Nova.jpg', 'assets/skill icons/Dark Nova.jpg');
        this.load.image('Fireball.jpg', 'assets/skill icons/Fireball.jpg');
        this.load.image('Holy Light.jpg', 'assets/skill icons/Holy Light.jpg');
        this.load.image('Poison Claw.jpg', 'assets/skill icons/Poison Claw.jpg');

        // Backgrounds:
        this.load.image('battlefield', 'assets/backgrounds/battlefield.jpg');
    }

    create() {
        this.bg = initBg(this);
        this.log = initCombatLog(this, this.scale.width / 2, this.scale.height - 40);
        logCombat(this, "The battle begins!", '#e0e0e0', '[START]');
        this.message = initMessage(this);
        this.turnText = initTurnText(this);
        initEventListeners(this);
        //initPortraitDims(this);
        initPortraitDimsWithScaleManager(this)

        initBattle(this);
        advanceToNextTurn(this);
    }

    update() {}
}