import { gameState } from "./gameState.js";
import { clearAffectedTargets, showDmgPopup } from "../ui/skillUI.js";
import { updateDebuffDisplay, updateHP, updateTurnMeter } from "../ui/portraitFactory.js";
import { showEndScreen } from "../ui/helpers.js";
import { logCombat, processLogQueue, setLogTarget } from "../ui/combatLog.js";
import { playPhysicalAttackTween } from "../ui/combatTweens.js";
import { uiStats } from "../ui/uiStats.js";
import { endTurn } from "./turnManager.js";

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

// Checks if the target died and updates gameState.
export function checkDeath(scene, target){
    const remainingHp = target.getData('hp');
    const team = target.getData('team');
    if (remainingHp <= 0){
        team === 'player' ? gameState.playerAlive-=1 : gameState.enemyAlive-=1;
        target.setData('debuffs', []);
        updateDebuffDisplay(scene, target);
        target.setData('turnMeter', 0);
        updateTurnMeter(scene, target, 0);
        return true;
    }
    return false;
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

// Source deals dmg damage to target. Returns boolean whether dmg was dealt or not (false on dead targets);
export function dmgTarget(scene, dmg, source, target, text=null, textColor = '#ED0000', textOnly = false){
    const currentHp = target.getData('hp');
    if (currentHp <= 0) return false;  // target is already dead ==> no dmg dealt

    // Maybe for later better logging or smth:
    const sourceName = source.getData('name');
    const targetName = target.getData('name');
    const newHp = Math.max(0, (currentHp - dmg));
    updateHP(target, newHp);

    showDmgPopup(scene, target.x, target.y, text ? `-${dmg}\n${text}` : `-${dmg}`, {fontSize: uiStats.dmgPopupFontsize, color: textColor, align: 'center'});

    if (dmg === 0) return false;  // still show dmg "popup" but return false that no dmg was dealt => no screen shake
    
    checkDeath(scene, target);
    return true;
}

// Ends battle after it's over.
export function endBattle(scene){
    if (gameState.winner === 'enemy'){
        logCombat(scene, `You lost!`, '#ED0000', '[END]');
    } else {
        logCombat(scene, `You win!`, '#00aa00', '[END]');
    }

    showEndScreen(scene, gameState.winner);
}

// Gets indeces of all from gameState.pendingSkill affected targets.
export function getAffectedTargets(area, hoveredIndex, team){
    if (area === 'single') return [hoveredIndex];
    else if (area === 'all'){
        const indeces = [];
        team.forEach(enemy => {
            if (enemy.getData('hp') > 0) indeces.push(enemy.getData('teamIndex'));
        });
        return indeces;
    } else {  // 'adjacent'
        const adj = [hoveredIndex, hoveredIndex - 1, hoveredIndex + 1];  // order matters to go from middle->left->right
        return adj.filter(i => (i >= 0 && i < team.length && team[i].getData('hp') > 0));
    }
}