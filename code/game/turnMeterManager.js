import { gameState, updateQeue } from "./gameState.js";
import { updateTurnMeter } from "../ui/portraitFactory.js";

// Boosts a unit's turn meter by a certain amount.
export function boostTurnMeter(scene, unit, amount){
    let tm = unit.getData('turnMeter');
    tm += Math.floor(gameState.combinedSpeed * amount);
    unit.setData('turnMeter', tm);

    updateTurnMeter(scene, unit, tm/gameState.combinedSpeed);
}

// Fills all units' turn meter by their speed amount and redraws their turn meter.
export function fillAllTurnMeters(scene){
    let max = 0;
    let keepGoing = true;

    while (keepGoing){
        gameState.turnQueue.forEach((container) => {
            if (container.getData('hp') > 0){
                let tm = container.getData('turnMeter');
                const speed = container.getData('char').getSpeed();
                tm += speed;
                container.setData('turnMeter', tm);
                if (tm > max) max = tm;
                if (tm >= gameState.combinedSpeed) keepGoing = false;
            }
        });
    }

    // Redraw turn meter:
    gameState.turnQueue.forEach((container) => {
        updateTurnMeter(scene, container, Math.min(1, container.getData('turnMeter')/gameState.combinedSpeed));
    });

    updateQeue();  // sort by turn meter

    // Check if multiple units with same turn meter ==> give turn to unit with fewest turns so far:
    let turnsTaken = gameState.turnQueue[0].getData('turnsTaken');
    let result = gameState.turnQueue[0];
    keepGoing = true;
    let i = 1;
    while (keepGoing){
        const candidate = gameState.turnQueue[i];
        if(candidate.getData('turnMeter') !== max) keepGoing = false; // no unit with same TM (sorted list) ==> return current candidate
        else {
            const candTurns = candidate.getData('turnsTaken');
            if(candTurns < turnsTaken){
                turnsTaken = candTurns;
                result = gameState.turnQueue[i];
            }
            i++;
        }
    }
    return result;
}

// Resets a target's turn meter. Called after turn taken.
export function resetTurnMeter(scene, unit){
    // Inc turn count:
    const turnsTaken = unit.getData('turnsTaken');
    unit.setData('turnsTaken', turnsTaken + 1);

    unit.setData('turnMeter', 0);  // reset turn meter
    updateTurnMeter(scene, unit, 0);
    gameState.turnQueue.push(gameState.turnQueue.shift());  // move first element to the back (slowest to the end)
}