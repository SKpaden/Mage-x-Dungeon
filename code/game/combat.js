import { gameState } from "./gameState.js";
import { clearAffectedTargets, showDmgPopup } from "../ui/skillUI.js";
import { updateDebuffDsiplay, updateHP, updateTurnMeter } from "../ui/portraitFactory.js";
import { delay, setPlayerTarget } from "../ui/helpers.js";
import { logCombat } from "../ui/combatLog.js";
import { uiStats } from "../ui/uiStats.js";
import { endTurn } from "./turnManager.js";

// Applies skill to current target.
export function applySkill(scene, index, skill){
    if (gameState.turn === 'player'){
        applySkillToEnemy(scene, index, skill);
    } else {
        applySkillToPlayer(scene, index, skill);
    }
}

// Applies pendingSkill to enemy at index.
function applySkillToEnemy(scene, index, skill){
    logCombat(scene, `You used ${skill.name}!`, '#e0e0e0', '[You]');
    skill.putCooldown();
    const affectedTargets = getAffectedTargets(skill, index, gameState.enemyContainers);
    clearAffectedTargets();

    const effectQueue = [];
    let dealtDmg = false;
    let updated = false;
    affectedTargets.forEach(i => {
        const target = gameState.enemyContainers[i];
        // const effect = new Effect(skill.name, skill.dmg, skill.targets, skill.element,
        //                           skill.debuff ? new Debuff(skill.debuff.name, skill.debuff.duration, skill.debuff.dmgPerTurn) : null);
        const effect = skill.effect;

        dealtDmg = effect.applyReactions(scene, gameState.selectedPlayer, target, effectQueue);
        if(dealtDmg) updated = true;
        effect.applyDebuff(gameState.selectedPlayer, target);
        updateDebuffDsiplay(scene, target);
        //dmgTarget(scene, effect.dmg, gameState.selectedPlayer, target);  // deal raw skill dmg first
    })
    if (updated) scene.cameras.main.shake(200, 0.01);  // screen after every reaction AND after initial dmg (fist call of this function)
    processReactionQueue(scene, effectQueue, gameState.selectedPlayer, gameState.enemyContainers, 0);
}

// Applies pendingSkill to enemy at index.
async function applySkillToPlayer(scene, source, target, index, team){
    const skill = gameState.pendingSkill;
    skill.putCooldown();
    logCombat(scene, `${source.getData('name')} used ${skill.name}!`, '#e0e0e0', '[Enemy]');
    const affectedTargets = getAffectedTargets(skill, index, team);

    const effectQueue = [];
    let dealtDmg = false;
    let updated = false;
    affectedTargets.forEach(i => {
        const currentTarget = team[i];
        // const effect = new Effect(skill.name, skill.dmg, skill.targets, skill.element,
        //                           skill.debuff ? new Debuff(skill.debuff.name, skill.debuff.duration, skill.debuff.dmgPerTurn) : null);
        const effect = skill.effect;

        dealtDmg = effect.applyReactions(scene, source, currentTarget, effectQueue);  // maybe return info about whether this was high or low dmg => only shake screen on high dmg
        if(dealtDmg) updated = true;
        effect.applyDebuff(source, currentTarget);
        updateDebuffDsiplay(scene, currentTarget);
        //dmgTarget(scene, effect.dmg, gameState.selectedPlayer, target);  // deal raw skill dmg first
    })
    if (updated) scene.cameras.main.shake(200, 0.01);  // screen after every reaction AND after initial dmg (fist call of this function)
    processReactionQueue(scene, effectQueue, source, team, 0);
    //clearPlayerTarget(scene, target);
}

// Processes all queued elemental Reactions.
async function processReactionQueue(scene, queue, source, team, index = 0){
    // All reactions triggered:
    if (index >= queue.length){
        if (checkWinner()) {
            endBattle(scene);
        }
        endTurn(scene, source);
    }
    else {  // still reactions left...
        await delay(scene, uiStats.reactionDelay);  // artificial delay

        const reaction = queue[index];
        if (triggerReaction(scene, reaction.targets, reaction.effect, queue, source, team)) scene.cameras.main.shake(200, 0.01);  // screen after every reaction AND after initial dmg (fist call of this function)

        processReactionQueue(scene, queue, source, team, index + 1);
    }
}

// Triggers a Reaction all all targets.
function triggerReaction(scene, targets, effect, queue, source, team){
    let dealtDmg = false;
    let updated = false;
        targets.forEach(i => {
            dealtDmg = effect.applyReactions(scene, source, team[i], queue);
            if (dealtDmg) updated = true;
        });
    return updated;
}

// Computer attacks the current lowest player character.
export function attackLowestPlayer(scene, source){
    let minHp = 999;
    let target = null;
    for (let i = 0; i < gameState.playerContainers.length; i++){
        const player = gameState.playerContainers[i];
        const playerHp = player.getData('hp');
        if (playerHp > 0 && playerHp < minHp){
            minHp = playerHp;
            target = player;
        }
    }
    if (target){
        gameState.pendingSkill = source.getData('char').chooseSkill();  // pick highest prio skill
        setPlayerTarget(scene, target);

        gameState.selectedEnemy = source;
        scene.time.delayedCall(800, () => applySkillToPlayer(scene, source, target, target.getData('teamIndex'), gameState.playerContainers));
        //return dmgTarget(scene, 10, source, target);
    } else {
        console.error('No target with >0 hp left!');
        return;
    }
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
    logCombat(scene, `${sourceName} dealt ${dmg} damage to ${targetName}!`, playerTurn ? '#00aa00' : '#ED0000', playerTurn ? '[You]' : '[Enemy]');

    checkDeath(scene, target);
    return true;
}

// Gets indeces of all from gameState.pendingSkill affected targets.
export function getAffectedTargets(skill, hoveredIndex, team){
    if (skill['targets'] === 'single') return [hoveredIndex];
    else if (skill['targets'] === 'all'){
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
    }
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
function endBattle(scene){
    if (gameState.winner === 'enemy'){
        logCombat(scene, `You lost!`, '#ED0000', '[END]');
    } else {
        logCombat(scene, `You win!`, '#00aa00', '[END]');
    }
    // more stuff to do later...
}