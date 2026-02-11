import { attackLowestPlayer, checkDeath, checkWinner } from "./combat.js";
import { gameState, updateQeue } from "./gameState.js";
import { logCombat } from "../ui/combatLog.js";
import { delay, updateText, setHighlight } from "../ui/helpers.js";
import { getPortraitTween, updateDebuffDsiplay, updateTurnMeter } from "../ui/portraitFactory.js";
import { showSkills, clearAffectedTargets } from "../ui/skillUI.js";
import { uiStats } from "../ui/uiStats.js";

// Decides who acts next in turn order.
export function advanceToNextTurn(scene){
    fillAllTurnMeters(scene);
    let check = true;
    let currentUnit;
    while (check){
        gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.turnQueue.length;
        currentUnit = gameState.turnQueue[gameState.currentTurnIndex];
        if (currentUnit.getData('hp') > 0) check = false;
        
    }

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
// Fills all units' turn meter by their speed amount and redraws their turn meter.
function fillAllTurnMeters(scene){
    let max = 0;
    // Add to turn meters:
    gameState.turnQueue.forEach((container) => {
        if (container.getData('hp') > 0){  // only alive ones
            const character = container.getData('char');
            let tm = container.getData('turnMeter');
            const speed = character.getSpeed();  // character call to maybe facilitate buffs/debuffs on speed
            tm += speed;
            container.setData('turnMeter', tm);  // update turnMeter value
            if (tm > max) max = tm;
        }
    });
    // Redraw turn meter:
    gameState.turnQueue.forEach((container) => {
        console.log(`${container.getData('name')}: ${container.getData('turnMeter')}/${max} = ${container.getData('turnMeter')/max}`);
        updateTurnMeter(scene, container, container.getData('turnMeter')/max);
    });

    updateQeue();
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
}

// End turn of unit. Cleans up state and triggers next turn.
export function endTurn(scene, unit){
    // processDebuffs(scene, unit);
    //processBuffs(scene, unit);
    unit.setData('turnMeter', 0);  // reset turn meter

    clearSelections();
    if (!gameState.winner) advanceToNextTurn(scene);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

// Processes enemy turn.
async function enemyTurn(scene, unit){
    unit.getData('char').reduceCooldowns();
    const debuffSkip = await processDebuffs(scene, unit);
    if (checkDeath(scene, unit)) checkWinner();
    if (debuffSkip){  // at least one debuff skips turn
        logCombat(scene, `${unit.getData('name')}  skipped turn because of ${debuffSkip}!`, '#ED0000', '[Enemy]');
        endTurn(scene, unit);
    } else {
        // processBuffs(scene, unit);
        // processCooldowns(scene, unit);
        attackLowestPlayer(scene, unit);
        
        //endTurn(scene, unit);
    }
}

// Processes player's turn.
async function playerTurn(scene, unit){
    unit.getData('char').reduceCooldowns();
    const debuffSkip = await processDebuffs(scene, unit);
    if (checkDeath(scene, unit)) checkWinner();
    if (debuffSkip){  // at least one debuff skips turn
        logCombat(scene, `${unit.getData('name')}  skipped turn because of ${debuffSkip}!`, '#00aa00', '[Enemy]');
        await delay(scene, 1000);
        endTurn(scene, unit);
    } else {
        // processBuffs(scene, unit);
        // processCooldowns(scene, unit);
        const tween = getPortraitTween(scene, unit);
        tween.play();
        setHighlight(unit,true);
        showSkills(scene, unit);
    }
}

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
        //deb.showDebuffPopupAsync(scene, target.x, target.y);
        return deb.duration > 0;
    });

    const remainingHp = target.getData('hp');
    if (remainingHp <= 0) skipTurn = 'Death';
    remainingHp > 0 ? target.setData('debuffs', debuffs) : target.setData('debuffs', []);
    
    updateDebuffDsiplay(scene, target);
    return skipTurn;
}