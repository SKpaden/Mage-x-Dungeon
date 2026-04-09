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