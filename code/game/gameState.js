import { createHeroPortrait, createEnemyPortrait } from "../ui/portraitFactory.js";
import { initSkillEventListener } from "../ui/skillUI.js";
import { uiStats } from "../ui/uiStats.js";

export const gameState = {
    turn: 'player',
    selectedPlayer: null,  // player team character's turn
    selectedEnemy: null,  // player's selected target
    pendingSkill: null,  // skill to be used
    playerContainers: [],  // player team
    enemyContainers: [],  // enemy team
    turnQueue: [],  // turn order
    currentTurnIndex: -1,  // 
    playerAlive: null,  // how many alive on player team
    enemyAlive: null,  // how many enemies alive
    winner: null
};

// Builds the turnQueue in gameState to decide turn order.
export function buildQueue(players, enemies){
    gameState.turnQueue = [...gameState.playerContainers, ...gameState.enemyContainers]
        .sort((a, b) => b.getData('speed') - a.getData('speed'));
    gameState.currentTurnIndex = -1;
}

// Initialises battle.
export function initBattle(scene){
    initPlayerTeam(scene);
    initEnemyTeam(scene);
    buildQueue(gameState.playerContainers, gameState.enemyContainers);
}

// Initialises enemy team.
export function initEnemyTeam(scene){
    const enemies = ['hero5', 'hero5', 'hero5', 'hero5', 'hero5'];
    const enemyNames = ['Grunt1', 'Grunt2', 'Grunt3', 'Grunt4', 'Grunt5'];
    gameState.enemyAlive = enemies.length;
    
    const spaceNeeded = enemies.length * uiStats.portraitWidth + (enemies.length-1)*uiStats.margin;  // #portraits*width + margins between them
    const whiteSpacePerSide = (scene.scale.width - spaceNeeded)/2;  // how much space on either side? (for xPos of first portrait)
    var xPos = whiteSpacePerSide + uiStats.portraitWidth/2;

    const yOffset = scene.scale.height-200-30;
    for (let index = 0; index  < enemies.length; index++) {
        const container = createEnemyPortrait(scene, xPos, yOffset, enemies[index], uiStats.portraitScale,  // location and size
                                                500, 2, enemyNames[index], 'enemy', index);  // stats
        xPos+= uiStats.portraitWidth + uiStats.margin;
        gameState.enemyContainers.push(container);
    }
}

// Maybe useful for later.
export function initEventListeners(scene){
    initSkillEventListener(scene);
}

// Initialises player team.
export function initPlayerTeam(scene){
    const portraits = ['my-hero', 'hero2', 'hero3', 'hero4', 'hero5'];  // array of portraits
    const heroNames = ['Dark Mage', 'Blue Dragon Queen', 'Draconoid Warrior', 'Poison Dragon Queen', 'Necromancer'];
    gameState.playerAlive = portraits.length;

    const spaceNeeded = portraits.length * uiStats.portraitWidth + (portraits.length-1)*uiStats.margin;  // #portraits*width + margins between them
    const whiteSpacePerSide = (scene.scale.width - spaceNeeded)/2;  // how much space on either side? (for xPos of first portrait)
    var xPos = whiteSpacePerSide + uiStats.portraitWidth/2;  // REMEMBER: CENTER-BASED POSITIONING!
    for (let index = 0; index < portraits.length; index++) {
        const container = createHeroPortrait(scene, xPos, 200, portraits[index], uiStats.portraitScale,  // location and size
                                             500, index+1, heroNames[index], 'player', index);  // stats
                                            //Math.floor(Math.random() * 250 + 1), index+1, heroNames[index], 'player', index);  // stats
        xPos+=uiStats.portraitWidth + uiStats.margin;  // enough spacing with margin   
        gameState.playerContainers.push(container);
    }
}