import { applySkillToPlayer, checkDeath, checkWinner, endBattle, processSkill } from "./combat.js";
import { gameState } from "./gameState.js";
import { fillAllTurnMeters, resetTurnMeter } from "./turnMeterManager.js";
import { logCombat } from "../ui/combatLog.js";
import { delay, updateText, setHighlight, setPlayerTarget } from "../ui/helpers.js";
import { getPortraitTween, updateDebuffDisplay} from "../ui/portraitFactory.js";
import { showSkills, clearAffectedTargets } from "../ui/skillUI.js";
import { uiStats } from "../ui/uiStats.js";

// Decides who acts next in turn order.
export function advanceToNextTurn(scene){
    let currentUnit = fillAllTurnMeters(scene);  // fill turn meters and return unit with highest TM

    if(currentUnit.getData('team') === 'player'){
        gameState.turn = 'player';
        updateText(scene.turnText, "Player Turn", '#00ff00');
        scene.time.delayedCall(800, () => playerTurn(scene, currentUnit));

    } else {
        gameState.turn = 'enemy';
        updateText(scene.turnText, "Enemy Turn", '#ED0000');
        scene.time.delayedCall(1000, () => enemyTurn(scene, currentUnit));
    }
}

// Clears gameState for next turn.
export function clearSelections(){
    const hero = gameState.selectedPlayer;
    if(hero){
        setHighlight(hero, false);
    }
    // clearAffectedTargets();
    gameState.pendingSkill = null;
    gameState.selectedEnemy = null;
    gameState.selectedPlayer = null;
    gameState.logQueue = {};  // reset logQueue
    gameState.reactionQueue = [];  // reset reaction queue
}

// End turn of unit. Cleans up state and triggers next turn.
export function endTurn(scene, unit){
    //processBuffs(scene, unit);
    resetTurnMeter(scene, unit);

    clearSelections();
    if (!gameState.winner) advanceToNextTurn(scene);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

// Processes enemy turn.
async function enemyTurn(scene, unit){
    const char =  unit.getData('char');
    char.reduceCooldowns();
    const debuffSkip = await processDebuffs(scene, unit);
    if (checkDeath(scene, unit)) {  // maybe do something specific to only death before
        if (checkWinner()) return endBattle(scene);
    }
    if (debuffSkip){  // at least one debuff skips turn
        logCombat(scene, `<strong>${unit.getData('name')}</strong>  skipped turn because of <strong>"${debuffSkip}"</strong>!`, '#ED0000', '[Enemy]');
        endTurn(scene, unit);
    } else {
        const skill = char.chooseSkill(scene, unit);
        const target = skill.chooseTarget(scene, unit, gameState.enemyContainers, gameState.playerContainers);
        gameState.pendingSkill = skill;  // update in gameState
        if (skill.type === 'Attack') setPlayerTarget(scene, target);  // highlight player with red border

        gameState.selectedEnemy = unit;
        scene.time.delayedCall(800, () => applySkillToPlayer(scene, unit, target, target.getData('teamIndex'), gameState.playerContainers));
        // processBuffs(scene, unit);
        
        //endTurn(scene, unit);
    }
}

// Processes player's turn.
async function playerTurn(scene, unit){
    unit.getData('char').reduceCooldowns();
    const debuffSkip = await processDebuffs(scene, unit);
    if (checkDeath(scene, unit)) {  // maybe do something specific to only death before
        if (checkWinner()) return endBattle(scene);
    }
    if (debuffSkip){  // at least one debuff skips turn
        logCombat(scene, `<strong>${unit.getData('name')}</strong>  skipped turn because of <strong>"${debuffSkip}"</strong>!`, '#00aa00', '[You]');
        await delay(scene, 1000);
        endTurn(scene, unit);
    } else {
        // processBuffs(scene, unit);
        const tween = getPortraitTween(scene, unit);
        tween.play();
        setHighlight(unit,true);
        showSkills(scene, unit);
    }
}

// Processes all debuffs at the start of a turn.
async function processDebuffs(scene, target){
    let skipTurn = null;
    let debuffs = target.getData('debuffs') || [];
    // Sequential popups with await:
    for (const deb of debuffs) {
        deb.showDebuffPopupAsync(scene, target.x, target.y);
        await delay(scene, uiStats.debuffDelay);  // wait for this popup to finish
    }
    debuffs = debuffs.filter(deb => {
        if (deb.skip()) skipTurn = deb.name;  // skip turn?
        deb.tick(scene, target);
        return deb.duration > 0;
    });

    const remainingHp = target.getData('hp');
    if (remainingHp <= 0) skipTurn = 'Death';
    remainingHp > 0 ? target.setData('debuffs', debuffs) : target.setData('debuffs', []);
    
    updateDebuffDisplay(scene, target);
    return skipTurn;
}