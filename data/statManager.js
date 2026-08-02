import { gameState } from "../game/gameState.js";

export class StatManager{
    // The temporary modifiers for these stats must be removed upon death:
    static deathCleanupStats = ['speed', 'dmgDealtMult', 'dmgTakenMult', 'resistances'];
    static multiplierStats = ['dmgDealtMult', 'dmgTakenMult', 'resistances'];

    constructor(stats){
        this.statData = stats;
    }

    /**
     * Creates and returns a deep copy of a stats object.
     * @param {Object} stats The stats object
     * @returns {Object} The copied stats object
     */
    static copyStats(stats){
        return {
            'speed': {
                current: stats.speed.current,
                base: stats.speed.base,
                modifiers: []
            },
            'hp': {
                current: stats.hp.current,
                base: stats.hp.base,
                modifiers: []
            },
            'dmgDealtMult': {
                current: stats.dmgDealtMult.current,
                base: stats.dmgDealtMult.base,
                modifiers: []
            },
            'dmgTakenMult': {
                current: stats.dmgTakenMult.current,
                base: stats.dmgTakenMult.base,
                modifiers: []
            },
            'resistances': {
                'Fire': {
                    current: stats.resistances.Fire.current,
                    base: stats.resistances.Fire.base,
                    modifiers: []
                },
                'Water': {
                    current: stats.resistances.Water.current,
                    base: stats.resistances.Water.base,
                    modifiers: []
                }
            }
        }
    }
    // Example:
    // stats: {
    //         'speed': {
    //             current: 20,
    //             base: 20
    //         },
    //         'hp': {
    //             current: 250,
    //             base: 250
    //         },
    //         'dmgDealtMult': {
    //             current: 1.0,
    //             base: 1.0
    //         },
    //         'dmgTakenMult': {
    //             current: 1.0,
    //             base: 1.0
    //         },
    //         'resistances': {
    //             'Fire': {
    //                 current: 0.5,
    //                 base: 0.5
    //             },
    //             'Water': {
    //                 current: 1.2,
    //                 base: 1.2
    //             }
    //         }
    //     }

    /**
     * Gets the current/base stat for a Character stored in a Phaser container object.
     * @param {Object} container The Phaser container belonging to the Character
     * @param {String} key The name of the stat to look for
     * @param {boolean} current Whether to get current or base stat
     * @returns {number} The current/base stat for the Character
     */
    static getContainerStat(container, key, current = true){
        const char = container.getData("char");
        const statManager = char.statManager;
        return current ? statManager.getCurrentStat(key) : statManager.getBaseStat(key);
    }

    /**
     * Updates the value of a stat for a Character stored in a Phaser container object.
     * @param {Object} container The Phaser container belonging to the Character
     * @param {String} key The name of the stat to update
     * @param {number} newValue The new value for the current stat
     */
    static setContainerStat(container, key, newValue){
        const char = container.getData("char");
        const statManager = char.statManager;
        const oldVal = statManager.getCurrentStat(key);
        statManager.setCurrentStat(key, newValue);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // NON-STATIC METHODS:

    /**
     * Adds a modifier to the active modifiers of a stat.
     * @param {String} statName The stat name
     * @param {Object} mod The modifier object
     */
    addModifier(statName, mod){
        this.statData[statName].modifiers.push(mod);
    }

    /**
     * Applies the modifier to the currentValue and returns the modified result.
     * @param {String} statName The stat name
     * @param {number} currentValue The current value of a stat
     * @param {Object} modifier The modifier object containing the type of the modification and the amount
     * @returns {number} The modified value
     */
    applyModifier(statName, currentValue, modifier){
        const factor = modifier.op === 'inc'
            ? 1 + modifier.amount
            : 1 - modifier.amount;

        let result;
        if (StatManager.multiplierStats.includes(statName)){  // stat is multiplier
            result = Math.round(currentValue * factor * 100) / 100;
        } else {
            result = Math.round(currentValue * factor);
        }
        return result;
    }

    /**
     * Removes all temporary modifiers from all stats that need to be cleaned up after death.
     */
    clearAllTemporaryModifiers(){
        for (const stat of StatManager.deathCleanupStats){
            if (stat === "resistances") continue;  // not needed yet
            const mods = this.statData[stat].modifiers;
            this.clearTemporaryModifiers(stat, mods);
            this.recalculateCurrent(stat);
        }
    }

    /**
     * Removes all temporary modifiers from a stat.
     */
    clearTemporaryModifiers(statName, mods){
        const newMods = mods.filter((mod) => {
            return !mod.temporary;
        });
        this.setModifiers(statName, newMods);
    }

    /**
     * Gets all current stats for a Character
     * @returns {Object} All current stats of a Character
     */
    getAllCurrentStats() {
        const result = {};
        for (const [key, value] of Object.entries(this.statData)) {
            if (key === 'resistances') {
                result[key] = {};
                for (const [elem, data] of Object.entries(value)) {
                    result[key][elem] = data.current;
                }
            } else {
                result[key] = value.current;
            }
        }
        return result;
    }

    /**
     * Gets the base resistance for an element.
     * @param {String} elementName The name of the element
     * @returns {float} The resistance value
     */
    getBaseResistance(elementName){
        return this.statData.resistances?.[elementName]?.base ?? 1.0;
    }

    /**
     * Gets the base value for a stat.
     * @param {String} statName The name for the stat to get
     * @returns {number} The base value for the stat
     */
    getBaseStat(statName){
        return this.statData[statName].base;
    }

    /**
     * Gets the current resistance value for an element.
     * @param {String} elementName The name for the element
     * @returns {number} The current resistance value
     */
    getCurrentResistance(elementName){
        return this.statData.resistances?.[elementName]?.current ?? 1.0;  // safe accessing
    }

    /**
     * Gets the current value for a stat.
     * @param {String} statName The name for the stat to get
     * @returns {number} The current value for the stat
     */
    getCurrentStat(statName){
        return this.statData[statName].current;
    }

    /**
     * Gets the list of currently active modifiers on a stat.
     * @param {String} statName The name for the stat
     * @returns {Array.<Object>} The list of active modifiers
     */
    getModifiers(statName){
        return this.statData[statName].modifiers;
    }

    /**
     * Recaclulates the current stat by applying all active modifiers to it.
     * @param {String} statName The name for the stat to recalculate
     */
    recalculateCurrent(statName){
        const mods = this.statData[statName].modifiers;
        const baseVal = this.statData[statName].base;
        let newCurrent = baseVal;
        for (const mod of mods){
            newCurrent = this.applyModifier(statName, newCurrent, mod);
        }
        this.setCurrentStat(statName, newCurrent);
    }

    /**
     * Filter out a modifier from the list of active stat mods.
     * @param {String} statName The stat name
     * @param {String} id The ID of the modifier to filter out
     */
    removeModifier(statName, id){
        const mods = this.getModifiers(statName);
        const filteredMods = mods.filter((mod) => {
            return mod.id !== id;
        });
        this.setModifiers(statName, filteredMods);
    }

    /**
     * Updates the current resistance for an element.
     * @param {String} elementName The name of the element
     * @param {float} newValue The new value for the resistance
     */
    setCurrentResistance(elementName, newValue){
        this.statData.resistances[elementName].current = newValue;
    }

    /**
     * Updates the current value of a stat.
     * @param {String} statName The stat name
     * @param {number} newValue The new value for the stat
     */
    setCurrentStat(statName, newValue){
        if (statName === 'speed'){
            const oldVal = this.getCurrentStat(statName);
            gameState.combinedSpeed += newValue - oldVal;
        }
        this.statData[statName].current = newValue;
    }

    /**
     * Updates the active modifiers of a stat.
     * @param {String} statName The stat name
     * @param {Array.<Object>} mods The updated list of modifiers
     */
    setModifiers(statName, mods){
        this.statData[statName].modifiers = mods;
    }
}