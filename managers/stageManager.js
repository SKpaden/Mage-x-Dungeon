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
 * Gets the enemies for the encounter via the stageID.
 * @param {int} stageID The id of the current stage
 * @returns {Array.<int>} The IDs of the characters for the stage encounter
 */
export function getStageEnemies(stageID){
    if (stageEnemies[stageID]) return stageEnemies[stageID];
    return [1, 2, 3, 4, 5];
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
 * Gets the stage rewards for the completed stage.
 * @param {int} stage Stage ID
 * @returns {Object} The object containing shard and hero reward
 */
export function getStageReward(stage){
    const rewards = stageRewards[stage];
    if (rewards) return rewards;
    throw new Error("Invalid stage for rewards: " + stage);
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


// Constants for hard-coded stage encounters and rewards:
const stageEnemies = {
    1: [8, 8, 8],
    2: [8, 8, 10, 8, 8],
    3: [1, 2, 3, 4, 5],
    4: [8, 11, 9, 11, 8],
    5: [11, 6, 7, 2, 11]
}
const stages = [1,2,3,4,5];
const stageLabels = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5'];
const unlockLookup = {
    1: 2,
    2: 3,
    3: 4,
    4: 5
}

const stageRewards = {
    1: {
        shards: 10,
        heroID: 8  // Demon Spawn
    },
    2: {
        shards: 25,
        heroID: 10  // Undead General
    },
    3: {
        shards: 50,
        heroID: 4 // Poison
    },
    4: {
        shards: 75,
        heroID: 11  // Royal Guard
    },
    5: {
        shards: 100,
        heroID: 6  // Rakthir
    }
}