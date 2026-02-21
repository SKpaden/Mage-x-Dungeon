import { gameState } from "./gameState.js";
import { clearAffectedTargets, showDmgPopup } from "../ui/skillUI.js";
import { updateDebuffDsiplay, updateHP, updateTurnMeter } from "../ui/portraitFactory.js";
import { delay, setPlayerTarget } from "../ui/helpers.js";
import { logCombat, processLogQueue } from "../ui/combatLog.js";
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

// Process skill use. Same for enemy and player.
export async function processSkill(scene, source, index, allies, enemies, skill){
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

export async function processReactions(scene, source, target, index, allies, enemies, area, effect, skillName){
    const affectedTargets = getAffectedTargets(area, index, enemies);
    const effectQueue = [];
    
    gameState.logQueue[skillName] = { 'targets': [], 'dmg': []};  // add skill to log queue
    let debuffsApplied = 0;
    let dealtDmg = false;
    let updated = false;

    playPhysicalAttackTween(scene, source, target.x, target.y);  // only play when dmg, but fine for now

    affectedTargets.forEach(i => {
        const currentTarget = enemies[i];

        dealtDmg = effect.applyReactions(scene, source, currentTarget, effectQueue, skillName);  // maybe return info about whether this was high or low dmg => only shake screen on high dmg
        if(dealtDmg) updated = true;  // if this happens once, keep it true
        debuffsApplied += effect.applyDebuff(source, currentTarget);  // add if debuffs applied
        updateDebuffDsiplay(scene, currentTarget);
    })
    if (updated) scene.cameras.main.shake(200, 0.01);  // screen after every reaction AND after initial dmg (fist call of this function)
    gameState.logQueue[`${skillName} Effects`] = { debuffsApplied: debuffsApplied, reactionsTriggered: effectQueue.length };
    await processReactionQueue(scene, effectQueue, source, enemies, 0);
}

// Processes all queued elemental Reactions.
async function processReactionQueue(scene, queue, source, team, index = 0){
    // All reactions triggered:
    if (index >= queue.length){
        return;
    }
    else {  // still reactions left...
        await delay(scene, uiStats.reactionDelay);  // artificial delay

        const reactionEntry = queue[index];
        const targets = reactionEntry.targets;
        const effect = reactionEntry.reaction.effect;
        if (triggerReaction(scene, reactionEntry.reaction , targets, effect, queue, source, team)) scene.cameras.main.shake(200, 0.01);  // screen after every reaction AND after initial dmg (fist call of this function)

        return processReactionQueue(scene, queue, source, team, index + 1);
    }
}

// Triggers a Reaction all all targets.
function triggerReaction(scene, reaction, targets, effect, queue, source, team){
    if (!gameState.logQueue[reaction.name]) gameState.logQueue[reaction.name] = { 'targets': [], 'dmg': []};  // add reaction to log queue
    let dealtDmg = false;
    let updated = false;
        targets.forEach(i => {
            dealtDmg = effect.applyReactions(scene, source, team[i], queue, reaction.name);
            if (dealtDmg) updated = true;
        });
    return updated;
}

// Source deals dmg damage to target. Returns boolean whether dmg was dealt or not (false on dead targets);
export function dmgTarget(scene, dmg, source, target, text=null, textColor = '#ED0000', textOnly = false){
    const currentHp = target.getData('hp');
    if (currentHp <= 0) return false;  // target is already dead ==> no dmg dealt
    if (textOnly){  // effect has no main dmg, just some debuff
        showDmgPopup(scene, target.x, target.y, text, {fontSize: uiStats.dmgPopupFontsize, color: textColor});
        return false;
    }

    const sourceName = source.getData('name');
    const targetName = target.getData('name');
    const newHp = Math.max(0, (currentHp - dmg));
    updateHP(target, newHp);

    // For centering:
    var prefix = "";
    if (text){
        const prefixAmount = Math.floor(text.length/2)-2;
        for (let index = 0; index < prefixAmount; index++) {
          prefix += " ";
        }
    }
    showDmgPopup(scene, target.x, target.y, text ? prefix + `-${dmg}\n${text}` : `-${dmg}`, {fontSize: uiStats.dmgPopupFontsize, color: textColor});

    if (dmg === 0) return false;  // still show dmg "popup" but return false that no dmg was dealt => no screen shake
    const playerTurn = gameState.turn === 'player';
    //logCombat(scene, `${sourceName} dealt ${dmg} damage to ${targetName}!`, playerTurn ? uiStats.playerLogColor : uiStats.enemyLogColor, playerTurn ? '[You]' : '[Enemy]');

    checkDeath(scene, target);
    return true;
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

// Checks if the target died and updates gameState.
export function checkDeath(scene, target){
    const remainingHp = target.getData('hp');
    const team = target.getData('team');
    if (remainingHp <= 0){
        team === 'player' ? gameState.playerAlive-=1 : gameState.enemyAlive-=1;
        target.setData('debuffs', []);
        updateDebuffDsiplay(scene, target);
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

// Ends battle after it's over.
export function endBattle(scene){
    if (gameState.winner === 'enemy'){
        logCombat(scene, `You lost!`, '#ED0000', '[END]');
    } else {
        logCombat(scene, `You win!`, '#00aa00', '[END]');
    }
    // more stuff to do later...
}