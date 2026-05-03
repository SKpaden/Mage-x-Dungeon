import { initBattle, initEventListeners, initGameState } from '../game/gameState.js';
import { advanceToNextTurn } from '../game/turnManager.js';
import { initBg, initMessage, initTurnText, initPortraitDimsWithScaleManager, updateText, resizeEndScreen } from '../ui/helpers.js';
import { initCombatLog, logCombat } from '../ui/combatLog.js';
import { resizeAllContainers } from '../ui/portraitFactory.js';
import { uiStats } from '../ui/uiStats.js';
import { getRegistryData, getSelectedPlayerTeam } from '../data/registryData.js';
import { createBackBtn, destroyBackBtn } from '../ui/backButton.js';
import { createMenuButton, destroyMenu } from '../ui/menu.js';
import { getEnemyTeam } from '../data/characters.js';
import { getStageEnemies } from '../managers/stageManager.js';
import { queueTeamImages } from '../managers/assetManager.js';

export default class BattleScene extends Phaser.Scene {
    constructor() { super({ key: 'battle' }); }
    // Load assets:
    preload() {  // works
        // Portraits:
        this.load.image('Draconoid - Dark Mage.jpg', 'assets/portraits/Draconoid - Dark Mage.jpg');  // sample portrait

        // Backgrounds:
        this.load.image('battlefield', 'assets/backgrounds/battlefield.jpg');
    }

    create() {
        setVariableUiStats(this);

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

        const stage = getRegistryData(this, 'selectedStage');  // what stage selected?
        const heroes = getSelectedPlayerTeam(this);  // what team selected?
        const enemies = getEnemyTeam(getStageEnemies(stage));  // what enemies on this stage?
        // Put image assets into load queue:
        queueTeamImages(this, heroes);
        queueTeamImages(this, enemies);

        // Listen for completion to continue:
        this.load.once("complete", () => {
            initBattle(this, heroes, enemies);
            advanceToNextTurn(this);
        })
        this.load.start();  // run the queue

        this.resizeHandler = () => {
            setVariableUiStats(this);
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

            // Resize end screen (if present):
            resizeEndScreen(this);
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
            // End overlay:
            const endOverlay = this.endOverlay;
            if (endOverlay){
                endOverlay.destroy();
                this.endOverlay = null;
            }
        });

        /**
         * Sets variable uiStats after a resize event.
         * @param {Phaser.Scene} scene The current Phaser scene object
         */
        function setVariableUiStats(scene){
            const sceneHalfWidth = scene.scale.width / 2;
            const sceneHalfheight = scene.scale.height / 2;
            const scene10thHeight = Math.floor(scene.scale.height / 10);
            const scene22ndHeight = Math.floor(scene.scale.height / 22);
            
            uiStats.sceneHalfW = sceneHalfWidth;
            uiStats.sceneHalfH = sceneHalfheight;

            uiStats.endButtonWidth = scene.scale.width / 6;
            uiStats.endButtonHeight = scene10thHeight;
            uiStats.endButtonFontSize = Math.floor(scene.scale.height/ 30);
            uiStats.endSubTextFontSize = scene22ndHeight;
            uiStats.endTitleFontSize = scene10thHeight;
            // Positioning:
            uiStats.endButtonYOffset = sceneHalfheight - scene10thHeight;
            uiStats.endTitleYOffset = -sceneHalfheight + scene10thHeight * 3/4;
            uiStats.endSubtextYOffset = -sceneHalfheight + 5/4 * scene10thHeight + scene22ndHeight;
        }
    }

    update() {}
}