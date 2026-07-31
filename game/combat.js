import { gameState, resetCharacters } from "./gameState.js";
import { clearAffectedTargets, showDmgPopup } from "../ui/skillUI.js";
import { updateDebuffDisplay, updateHP, updateTurnMeter } from "../ui/portraitFactory.js";
import { showEndScreen } from "../ui/helpers.js";
import { logCombat, processLogQueue, setLogTarget } from "../ui/combatLog.js";
import { uiStats } from "../ui/uiStats.js";
import { endTurn } from "./turnManager.js";
import { updateStageAccountData } from "../managers/accountManager.js";
import { StatManager } from "../data/statManager.js";

// Applies skill to current target.
export function applySkill(scene, index, skill){
    if (gameState.turn === 'player'){
        const source = gameState.selectedPlayer;
        applySkillToEnemy(scene, source, index, skill);
    } else {
        applySkillToPlayer(scene, index, skill);
    }
}

// Applies pendingSkill to enemy at index.
function applySkillToEnemy(scene, source, index, skill){
    logCombat(scene, `You used <strong>${skill.name}</strong>!`, '#e0e0e0', '[You]');

    // Scene, source, i, allies, enemies, skill:
    processSkill(scene, source, index, gameState.playerContainers, gameState.enemyContainers, skill);
}

// Applies pendingSkill to enemy at index.
export function applySkillToPlayer(scene, source, target, index, team){
    const skill = gameState.pendingSkill;
    logCombat(scene, `<strong>${source.getData('name')}</strong> used <strong>${skill.name}<strong>!`, '#e0e0e0', '[Enemy]');

    // Scene, source, i, allies, enemies, skill:
    processSkill(scene, source, index, gameState.enemyContainers, team, skill);
}

// Checks if there is a winner.
export function checkWinner(){
    if(gameState.playerAlive === 0){
        gameState.winner = 'enemy';
        return true;
    } else if(gameState.enemyAlive === 0){
        gameState.winner = 'player';
        return true;
    }
    return false;  // no winner
}

// Process skill use. Same for enemy and player.
export async function processSkill(scene, source, index, allies, enemies, skill){
    setLogTarget(skill.name);
    let target;
    if (skill.type === 'Attack') target = enemies[index];
    else target = allies[index];
    // scene, source of skill use, target, index, allies, enemies
    await skill.apply(scene, source, target, index, allies, enemies);  // new part
    skill.putCooldown();
    // Log dmg and end:
    processLogQueue(scene, gameState.logQueue, source);
    if (checkWinner()) {
        endBattle(scene);
    }
    endTurn(scene, source);
}

// Ends battle after it's over.
export function endBattle(scene){
    if (gameState.winner === 'enemy'){
        logCombat(scene, `You lost!`, '#ED0000', '[END]');
    } else {
        logCombat(scene, `You win!`, '#00aa00', '[END]');
        updateStageAccountData(scene);
    }

    showEndScreen(scene, gameState.winner);
}

// Gets indeces of all from gameState.pendingSkill affected targets.
export function getAffectedTargets(area, hoveredIndex, team){
    if (area === 'single') return [hoveredIndex];
    else if (area === 'all'){
        const indeces = [];
        team.forEach(enemy => {
            if (StatManager.getContainerStat(enemy, "hp") > 0) indeces.push(enemy.getData('teamIndex'));
        });
        return indeces;
    } else {  // 'adjacent'
        const adj = [hoveredIndex, hoveredIndex - 1, hoveredIndex + 1];  // order matters to go from middle->left->right
        return adj.filter(i => (i >= 0 && i < team.length && StatManager.getContainerStat(team[i], "hp") > 0));
    }
}

/**
 * Returns an array of affected targets as containers.
 * @param {String} area The area of the Skill ('all', 'adjacent', 'single')
 * @param {int} hoveredIndex The index of the initial target
 * @param {Array.<Object>} team The array of Phaser containers of the charcters belonging to the initial target's team
 * @returns {Array.<Object>} The array of affected targets by the Skill.
 */
export function getAffectedTargetsAsContainers(area, hoveredIndex, team){
    if (area === 'single') return [team[hoveredIndex]];
    let results = [];
    if (area === 'all'){
        team.forEach(enemy => {
            if (StatManager.getContainerStat(enemy, "hp") > 0) results.push(enemy);
        });
    } else {  // 'adjacent'
        const adj = [hoveredIndex, hoveredIndex - 1, hoveredIndex + 1];  // order matters to go from middle->left->right
        const filteredIndexes = adj.filter(i => (i >= 0 && i < team.length && StatManager.getContainerStat(team[i], "hp") > 0));
        filteredIndexes.forEach(i => {
            results.push(team[i]);
        });
    }
    return results;
}

export function getReviveTargets(area, hoveredIndex, team){
    if (area === 'single') return [hoveredIndex];
    else if (area === 'all'){
        const indeces = [];
        team.forEach(member => {
            if (StatManager.getContainerStat(member, "hp") === 0) indeces.push(member.getData('teamIndex'));
        });
        return indeces;
    } else {
        const adj = [hoveredIndex, hoveredIndex - 1, hoveredIndex + 1];
        return adj.filter(i => (i >= 0 && i < team.length && StatManager.getContainerStat(team[i], "hp") === 0));
    }
}