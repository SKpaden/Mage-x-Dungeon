import { initBattle, initEventListeners, initGameState } from '../game/gameState.js';
import { advanceToNextTurn } from '../game/turnManager.js';
import { initBg, initMessage, initTurnText, initPortraitDims, initPortraitDimsWithScaleManager, updateText } from '../ui/helpers.js';
import { initCombatLog, logCombat } from '../ui/combatLog.js';
import { resizeAllContainers } from '../ui/portraitFactory.js';
import { uiStats } from '../ui/uiStats.js';
import { getRegistryData } from '../data/registryData.js';
import { createBackBtn, destroyBackBtn } from '../ui/backButton.js';
import { createMenuButton, destroyMenu } from '../ui/menu.js';

export default class BattleScene extends Phaser.Scene {
    constructor() { super({ key: 'battle' }); }
    // Load assets:
    preload() {  // works
        // Portraits:
        this.load.image('Draconoid - Dark Mage.jpg', 'assets/portraits/Draconoid - Dark Mage.jpg');
        this.load.image('Dragon Queen - Blue.jpg', 'assets/portraits/Dragon Queen - Blue.jpg');
        this.load.image('Draconoid - Warrior.jpg', 'assets/portraits/Draconoid - Warrior.jpg');
        this.load.image('Dragon Queen - Poison.jpg', 'assets/portraits/Dragon Queen - Poison.jpg');
        this.load.image('Draconoid - Necromancer.jpg', 'assets/portraits/Draconoid - Necromancer.jpg');

        this.load.image('Rakthir.jpg', 'assets/portraits/Rakthir.jpg');
        this.load.image('Kresh.jpg', 'assets/portraits/Kresh.jpg');
        this.load.image('Demon Spawn.jpg', 'assets/portraits/Demon Spawn.jpg');
        this.load.image('Caltraxa.jpg', 'assets/portraits/Caltraxa.jpg');

        // SKills:
        this.load.image('Claw Strike.jpg', 'assets/skill icons/Claw Strike.jpg');
        this.load.image('Dark Nova.jpg', 'assets/skill icons/Dark Nova.jpg');
        this.load.image('Fireball.jpg', 'assets/skill icons/Fireball.jpg');
        this.load.image('Holy Light.jpg', 'assets/skill icons/Holy Light.jpg');
        this.load.image('Poison Claw.jpg', 'assets/skill icons/Poison Claw.jpg');

        this.load.image('Revenge.jpg', 'assets/skill icons/Revenge.jpg');
        this.load.image('Intimidate.jpg', 'assets/skill icons/Intimidate.jpg');
        this.load.image('War Cry.jpg', 'assets/skill icons/War Cry.jpg');
        this.load.image('Dash.jpg', 'assets/skill icons/Dash.jpg');
        this.load.image('Poison Cloud.jpg', 'assets/skill icons/Poison Cloud.jpg');
        this.load.image('Ally Attack.jpg', 'assets/skill icons/Ally Attack.jpg');
        this.load.image('Poison Bomb.jpg', 'assets/skill icons/Poison Bomb.jpg');
        this.load.image('Poison Activation.jpg', 'assets/skill icons/Poison Activation.jpg');
        this.load.image('Endless Suffering.jpg', 'assets/skill icons/Endless Suffering.jpg');

        this.load.image('Lightning Strike.jpg', 'assets/skill icons/Lightning Strike.jpg');
        this.load.image('Energy Burst.jpg', 'assets/skill icons/Energy Burst.jpg');
        this.load.image('Chain Lightning.jpg', 'assets/skill icons/Chain Lightning.jpg');
        this.load.image('Surging Gaze.jpg', 'assets/skill icons/Surging Gaze.jpg');

        // Backgrounds:
        this.load.image('battlefield', 'assets/backgrounds/battlefield.jpg');
    }

    create() {
        this.menuBtn = createMenuButton(this, uiStats.menuBtnX, uiStats.menuBtnY, uiStats.menuBtnDims);
        this.backBtn = createBackBtn(this, 'map');
        
        this.bg = initBg(this, 'battlefield', 0x202020);
        initGameState(this);
        this.log = initCombatLog(this, 20, this.scale.height / 2);  // 20 padding left of log element, middle on y-axis
        logCombat(this, "The battle begins!", '#e0e0e0', '[START]');
        this.message = initMessage(this);
        this.turnText = initTurnText(this);
        initEventListeners(this);
        initPortraitDimsWithScaleManager(this);

        const stage = getRegistryData(this, 'selectedStage');
        initBattle(this, stage);
        advanceToNextTurn(this);

        this.resizeHandler = () => {
            // BG:
            this.bg.destroy();
            this.bg = initBg(this, 'battlefield', 0x202020);
            this.children.sendToBack(this.bg);  // render in background under all other elements

            // Combat log:
            this.log.y = this.scale.height / 2;  // bring back to middle

            // Center message:
            this.message.x = this.scale.width / 2;
            this.message.y = this.scale.height / 2;

            // Turn indicator:
            this.turnText.x = this.scale.width*0.85 + uiStats.margin;
            this.turnText.y = this.scale.height / 2;

            // Update uiStats for portraits:
            initPortraitDimsWithScaleManager(this);

            // Resize cahracter displays:
            resizeAllContainers(this);
        }

        // For dynamic resizing:
        this.scale.on('resize', this.resizeHandler);

        // Cleanup on shutdown:
        this.events.once("shutdown", () => {
            this.scale.off('resize', this.resizeHandler);
            this.resizeHandler = null;  // clear reference
            // Menu + Back button:
            destroyMenu(this);
            destroyBackBtn(this);
        });
    }

    update() {}
}