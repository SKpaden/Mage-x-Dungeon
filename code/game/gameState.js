import { getHeroTeam, getEnemyTeam } from "../data/characters.js";
import { getRegistryData } from "../data/registryData.js";
import { createHeroPortraitAlt, createEnemyPortraitAlt } from "../ui/portraitFactory.js";
import { initSkillEventListener } from "../ui/skillUI.js";
import { uiStats } from "../ui/uiStats.js";

export const gameState = {
    turn: 'player',
    turnNumber: 0,
    selectedPlayer: null,  // player team character's turn
    selectedEnemy: null,  // player's selected target
    pendingSkill: null,  // skill to be used
    playerContainers: [],  // player team
    enemyContainers: [],  // enemy team
    turnQueue: [],  // turn order
    logQueue: {},
    reactionQueue: [],
    combinedSpeed: 0,
    playerAlive: null,  // how many alive on player team
    enemyAlive: null,  // how many enemies alive
    winner: null
};

// Builds the turnQueue in gameState to decide turn order.
export function buildQueue(){
    gameState.turnQueue = [...gameState.playerContainers, ...gameState.enemyContainers];
}

// Resorts the queue regarding the turn meter.
export function updateQeue(){
    gameState.turnQueue = gameState.turnQueue.sort((a,b) => b.getData('turnMeter') - a.getData('turnMeter'));
}

// Initialises battle.
export function initBattle(scene){
    initPlayerTeamAlt(scene);
    initEnemyTeamAlt(scene);
    buildQueue();
}

// Maybe useful for later.
export function initEventListeners(scene){
    initSkillEventListener(scene);
}

// Inits the global gameState variable.
export function initGameState(scene){
    gameState.turnNumber = 0;
    gameState.playerContainers = [];
    gameState.enemyContainers = [];
    gameState.selectedEnemy = null;
    gameState.selectedPlayer = null;
    gameState.turnQueue = [];
    gameState.winner = null;
    gameState.combinedSpeed = 0;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ALT FUNCTIONS WITH CLASSES:

export function initPlayerTeamAlt(scene){
    // Read team from registry:
    const heroes = getRegistryData(scene, 'playerTeam');  // Array.<CollectionEntry>

    gameState.playerAlive = heroes.length;

    const spaceNeeded = heroes.length * uiStats.portraitWidth + (heroes.length-1)*uiStats.margin;  // #portraits*width + margins between them
    const whiteSpacePerSide = (scene.scale.width - spaceNeeded)/2;  // how much space on either side? (for xPos of first portrait)
    var xPos = whiteSpacePerSide + uiStats.portraitWidth/2;  // REMEMBER: CENTER-BASED POSITIONING!
    for (let index = 0; index < heroes.length; index++) {
        const hero = heroes[index].hero;
        gameState.combinedSpeed += hero.getSpeed();
        const container = createHeroPortraitAlt(scene, xPos, uiStats.halfH + 20, hero, uiStats.portraitScale, 'player', index);  // stats
        xPos+=uiStats.portraitWidth + uiStats.margin;  // enough spacing with margin   
        gameState.playerContainers.push(container);
    }
}

export function initEnemyTeamAlt(scene){
    const enemies = getEnemyTeam();

    gameState.enemyAlive = enemies.length;
    
    const spaceNeeded = enemies.length * uiStats.portraitWidth + (enemies.length-1)*uiStats.margin;  // #portraits*width + margins between them
    const whiteSpacePerSide = (scene.scale.width - spaceNeeded)/2;  // how much space on either side? (for xPos of first portrait)
    var xPos = whiteSpacePerSide + uiStats.portraitWidth/2;

    const yOffset = scene.scale.height-200-30;
    for (let index = 0; index  < enemies.length; index++) {
        const enemy = enemies[index];
        gameState.combinedSpeed += enemy.getSpeed();
        const container = createEnemyPortraitAlt(scene, xPos, scene.scale.height - uiStats.halfH - 20 - 35, enemy, uiStats.portraitScale,'enemy', index);  // stats
        xPos+= uiStats.portraitWidth + uiStats.margin;
        gameState.enemyContainers.push(container);
    }
}