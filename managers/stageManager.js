import { getRegistryData, setRegistryData } from "../data/registryData.js";

/**
 * Gets the completed stages from the registry.
 * @param {Phaser.Scene} scene          The current Phaser scene object
 * @returns {Array.<int> | undefined}   The completed stages
 */
export function getCompletedStages(scene){
    return getRegistryData(scene, 'completedStages');
}

/**
 * Gets all available stages.
 * @returns {Array.<int>}   The array of all stages (ids)
 */
export function getStages(){
    return stages;
}

/**
 * Gets the labels for all stages.
 * @returns {Array.<String>}    The array of all stage labels
 */
export function getStageLabels(){
    return stageLabels;
}

/**
 * Gets the unlocked stages or initializes with the first stage.
 * @param {Phaser.Scene} scene  The current Phaser scene object
 * @returns {Array.<int>}       The unlocked stages
 */
export function getUnlockedStages(scene){
    let unlockedStages = getRegistryData(scene, 'unlockedStages');
    if (!unlockedStages){  // first call => init
        unlockedStages = [1];
        setRegistryData(scene, 'unlockedStages', unlockedStages);
    }

    return unlockedStages;
}

/**
 * Updates the Phaser registry data based on the 
 * @param {Phaser.Scene} scene The current Phaser scene
 */
export function updateStageData(scene){
    const selectedStage = getRegistryData(scene, "selectedStage");  // what stage was completed?
    const completedStages = getCompletedStages(scene);
    const unlockedStages = getUnlockedStages(scene);

    if (completedStages){
        completedStages.push(selectedStage); 
    } else {
        setRegistryData(scene, 'completedStages', [selectedStage]);
    }
    
    if (isNotLastStage(selectedStage)) {
        unlockNextStage(selectedStage, unlockedStages);
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

/**
 * Checks if the completed stage is the final stage or not. The final stage does not unlock new stages.
 * @param {String} stage    The string identifier of the completed stage
 * @returns {boolean}       Whether it's the final stage or not
 */
function isNotLastStage(stage){
    return stage === stages[stage.length - 1] ? false : true;
}

/**
 * Unlocks the next stage(s) for the player by pushing to the registry array.
 * @param {int} stage               The identifier of the completed stage
 * @param {Array.<int>} unlocked    The array of unlocked stages on an account
 */
function unlockNextStage(stage, unlocked){
    const nextStage = unlockLookup[stage];
    if (!unlocked.includes(nextStage)) unlocked.push(nextStage);  // unlock only if locked
}

const stages = [1,2,3,4,5];
const stageLabels = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5'];
const unlockLookup = {
    1: 2,
    2: 3,
    3: 4,
    4: 5
}