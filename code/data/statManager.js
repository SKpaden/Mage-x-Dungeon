export class StatManager{
    constructor(stats){
        this.statData = stats;
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
    //         'dmgMult': {
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

    getBaseResistance(elementName){
        return this.statData.resistances?.[elementName]?.base ?? 1.0;
    }

    getBaseStat(statName){
        return this.statData[statName].base;
    }

    getCurrentResistance(elementName){
        return this.statData.resistances?.[elementName]?.current ?? 1.0;  // safe accessing
    }

    getCurrentStat(statName){
        return this.statData[statName].current;
    }

    setCurrentResistance(elementName, newValue){
        this.statData['resistances'][elementName].current = newValue;
    }

    setCurrentStat(statName, newValue){
        this.statData[statName].current = newValue;
    }
}