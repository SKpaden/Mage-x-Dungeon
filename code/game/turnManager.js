import { attackLowestPlayer } from "./combat.js";
import { gameState } from "./gameState.js";
import { updateText, setHighlight } from "../ui/helpers.js";
import { getPortraitTween, updateDebuffDsiplay } from "../ui/portraitFactory.js";
import { showSkills, clearAffectedTargets } from "../ui/skillUI.js";

// Decides who acts next in turn order.
export function advanceToNextTurn(scene){
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
        playerTurn(scene, currentUnit);

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
    clearAffectedTargets();
    gameState.pendingSkill = null;
    gameState.selectedEnemy = null;
    gameState.selectedPlayer = null;
}

// End turn of unit. Cleans up state and triggers next turn.
export function endTurn(scene, unit){
    // processDebuffs(scene, unit);
    //processBuffs(scene, unit);
    clearSelections();
    if (!gameState.winner) advanceToNextTurn(scene);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

// Processes enemy turn.
function enemyTurn(scene, unit){
    const debuffSkip = processDebuffs(scene, unit);
    if (debuffSkip){  // at least one debuff skips turn
        scene.message.setText(unit.getData('name') + ' skipped turn because of ' + debuffSkip + "!");
        endTurn(scene, unit);
    } else {
        // processBuffs(scene, unit);
        // processCooldowns(scene, unit);
        attackLowestPlayer(scene, unit);
        
        endTurn(scene, unit);
    }
}

// Processes player's turn.
function playerTurn(scene, unit){
    const debuffSkip = processDebuffs(scene, unit);
    if (debuffSkip){  // at least one debuff skips turn
        scene.message.setText(unit.getData('name') + ' skipped turn because of "' + debuffSkip + '"!');
        scene.time.delayedCall(1000, () => endTurn(scene, unit));
    } else {
        // processBuffs(scene, unit);
        // processCooldowns(scene, unit);
        const tween = getPortraitTween(scene, unit);
        tween.play();
        setHighlight(unit,true);
        showSkills(scene, unit);
    }
}

function processDebuffs(scene, target){
    let skipTurn = null;
    let debuffs = target.getData('debuffs') || [];
    debuffs = debuffs.filter(deb => {
        if (deb.skip()) skipTurn = deb.name;  // skip turn?
        deb.tick(target);
        return deb.duration > 0;
    });

    const remainingHp = target.getData('hp');
    if (remainingHp <= 0) skipTurn = 'Death';
    remainingHp > 0 ? target.setData('debuffs', debuffs) : target.setData('debuffs', []);
    
    updateDebuffDsiplay(scene, target);
    return skipTurn;
}