import { gameState } from "./gameState.js";
import { showDmgPopup } from "../ui/skillUI.js";
import { updateDebuffDsiplay, updateHP } from "../ui/portraitFactory.js";
import { endTurn } from "./turnManager.js";

// Applies skill to current target.
export function applySkill(scene, index){
    if (gameState.turn === 'player'){
        applySkillToEnemy(scene, index);
        // shake camera, maybe only on crits and MOVE TO UI STUFF
        // scene.cameras.main.shake(200, 0.01);  // duration, intensity
    } else {
        applySkillToPlayer(scene, index);
    }
}

// Applies pendingSkill to enemy at index.
function applySkillToEnemy(scene, index){
    const skill = gameState.pendingSkill;
    const affectedTargets = getAffectedTargets(skill, index, gameState.enemyContainers);

    const effectQueue = [];

    affectedTargets.forEach(i => {
        const target = gameState.enemyContainers[i];
        // const effect = new Effect(skill.name, skill.dmg, skill.targets, skill.element,
        //                           skill.debuff ? new Debuff(skill.debuff.name, skill.debuff.duration, skill.debuff.dmgPerTurn) : null);
        const effect = skill.effect;

        effect.applyReactions(scene, gameState.selectedPlayer, target, effectQueue);
        effect.applyDebuff(gameState.selectedPlayer, target);
        updateDebuffDsiplay(scene, target);
        //dmgTarget(scene, effect.dmg, gameState.selectedPlayer, target);  // deal raw skill dmg first
    })

    processReactionQueue(scene, effectQueue, gameState.selectedPlayer, gameState.enemyContainers, 0);
}

// Processes all queued elemental Reactions.
async function processReactionQueue(scene, queue, source, team, index = 0){
    scene.cameras.main.shake(200, 0.01);  // screen after every reaction AND after initial dmg (fist call of this function)
    // All reactions triggered:
    if (index >= queue.length){
        if (checkWinner()) {
            endBattle(scene);
        }
        endTurn(scene, source);
    }
    else {  // still reactions left...
        await new Promise((resolve) => scene.time.delayedCall(800, resolve));  // artificial delay
        
        const reaction = queue[index];
        triggerReaction(scene, reaction.targets, reaction.effect, queue, source, team);

        processReactionQueue(scene, queue, source, team, index + 1);
    }
}

// Triggers a Reaction all all targets.
function triggerReaction(scene, targets, effect, queue, source, team){
        targets.forEach(i => {
            effect.applyReactions(scene, source, team[i], queue);
        });
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
        return dmgTarget(scene, 10, source, target);
    } else {
        console.error('No target with >0 hp left!');
        return;
    }
}

// Source deals dmg damage to target.
export function dmgTarget(scene, dmg, source, target, text=null, textColor = '#ED0000'){
    const sourceName = source.getData('name');
    const targetName = target.getData('name');
    const currentHp = target.getData('hp');
    const newHp = Math.max(0, (currentHp - dmg));
    updateHP(target, newHp);

    const enemyX = target.x;
    const enemyY = target.y;

    // For centering:
    var prefix = "";
    if (text){
        const prefixAmount = Math.floor(text.length/2)-2;
        for (let index = 0; index < prefixAmount; index++) {
          prefix += " ";
        }
    }
    showDmgPopup(scene, enemyX, enemyY, text ? prefix + `-${dmg}\n${text}` : `-${dmg}`, { fontSize: '32px', color: textColor});

    scene.message.setText(`${sourceName} dealt ${dmg} damage to ${targetName}!`);

    checkDeath(scene, target);
    return newHp > 0 ? true : false;
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
function checkDeath(scene, target){
    const remainingHp = target.getData('hp');
    const team = target.getData('team');
    if (remainingHp <= 0){
        team === 'player' ? gameState.playerAlive-=1 : gameState.enemyAlive-=1;
        target.setData('debuffs', []);
        updateDebuffDsiplay(scene, target);
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
        scene.message.setText("You lost!");
        scene.message.setColor('#ED0000');
    } else {
        scene.message.setText("You win!");
        scene.message.setColor('#00ff00');
    }
    // more stuff to do later...
}