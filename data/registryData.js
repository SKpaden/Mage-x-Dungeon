/**
 * Gets the selected player team from the registry and maps it to an array of Characters.
 * @param {Phaser.Scene} scene The current Phaser scene object
 * @returns {Array.<Character>} The array of Character objects
 */
export function getSelectedPlayerTeam(scene){
    // Read team from registry:
    let heroes = getRegistryData(scene, 'playerTeam');  // Array.<CollectionEntry>
    heroes = heroes.map((entry) => entry.hero);  // Array.<Character>
    return heroes;
}

/**
 * Gets data from the registry with a key.
 * @param {Phaser.Scene} scene  The current Phaser scene
 * @param {String} key          The key for the data
 * @returns                     The registry data or null                    
 */
export function getRegistryData(scene, key){
    return scene.registry.get(key);
}

/**
 * Sets data in the registry with key and value.
 * @param {Phaser.Scene} scene  The current Phaser scene
 * @param {String} key          The key for the data
 * @param {*} value             The (new) value for the data
 */
export function setRegistryData(scene, key, value){
    try {
        scene.registry.set(key, value);
        return true;
    } catch (error){
        console.error("Encountered an error while writing to registry: " + error);
        throw new Error("Failed to write data to registry");
    }
}