import { gameState } from "../game/gameState.js";

export class StatManager{
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
                base: stats.speed.base
            },
            'hp': {
                current: stats.hp.current,
                base: stats.hp.base
            },
            'dmgDealtMult': {
                current: stats.dmgDealtMult.current,
                base: stats.dmgDealtMult.base
            },
            'dmgTakenMult': {
                current: stats.dmgTakenMult.current,
                base: stats.dmgTakenMult.base
            },
            'resistances': {
                'Fire': {
                    current: stats.resistances.Fire.current,
                    base: stats.resistances.Fire.base
                },
                'Water': {
                    current: stats.resistances.Water.current,
                    base: stats.resistances.Water.base
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
        if (key === 'speed') gameState.combinedSpeed += newValue - oldVal;
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
        this.statData[statName].current = newValue;
    }
}