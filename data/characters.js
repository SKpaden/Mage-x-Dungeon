import { Account } from "../managers/accountManager.js";
import { getPassiveObjects } from "./passives.js";
import { createSkillFromTemplate, Skill } from "./skills.js";
import { StatManager } from "./statManager.js";

export class Character{
    constructor(id, name, portrait, maxHp, speed, skills, skillPriorities, resistences, passives, tags, description, stats){  // add id maybe
        this.id = id;
        this.name = name;
        this.portrait = portrait;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.speed = speed;
        if (skills.length  !== skillPriorities.length) console.error(`${name} does not have the correct amount of skills or prios!`);
        this.skills = skills;
        this.skillPriorities = skillPriorities;
        
        // WAY LATER:
        this.resistences = resistences;
        // Passives:
        this.passives = [];
        this.passiveEvents = new Map();
        passives.forEach(passive => this.addPassive(passive));

        this.tags = tags;
        this.description = description;
        this.statManager = new StatManager(StatManager.copyStats(stats));  // I didn't copy and had mutation...
    }

    // Add a passive to array of passives and register its event.
    addPassive(passive){
        this.passives.push(passive);
        passive.registerEvents(this.passiveEvents);
    }

    /**
     * Returns the relative path for the hero portrait.
     * @returns {String}    The path to the hero portrait
     */
    getPortraitPath(){
        return "assets/portraits/" + this.portrait;
    }

    // Choose skill to use based on priorities.
    chooseSkill(){
        for (let i = 0; i < this.skills.length; i++){
            const prioIndex = this.skillPriorities[i];
            const skill = this.skills[prioIndex];
            if (!skill.currentCD) return skill;
        }
        console.error("SOMETHING WENT WRONG WHEN CHOOSING SKILL!");
    }

    // Returns the current speed.
    getSpeed(){
        return this.statManager.getCurrentStat('speed');
    }

    // Puts all skills on CD.
    lockout(){
        // Potential resist logic here ==> return false:
        this.skills.forEach(skill => {
            skill.putCooldown();
        })
        return true;
    }

    // Reduces cooldown of all skills by 1 turn. Call at the end of round.
    reduceCooldowns(){
        this.skills.forEach((skill) => skill.decreaseCD());
    }

    /**
     * Resets state of the Character (skills, stats).
     */
    reset(){
        this.resetCDs();
        // this.resetStats();  // later maybe
    }

    resetCDs(){
        // Potential effects that deny reset here ==> return false.
        this.skills.forEach((skill) => skill.currentCD = 0);
        return true;
    }

    // Trigger event (call all handlers for that event):
    triggerEvent(eventName, ...args) {
        let handler = this.passiveEvents.get(eventName) || null;
        let result = true;  // default allow (for 'onDebuffApplied')
        if (handler){
            result = handler(...args);
        }
        return result;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CREATE HEROES FROM TEMPLATES:

/**
 * Gets all the existing hero IDs in an array.
 * @returns {Array.<int>} The array containing all existing hero ids.
 */
export function getAllHeroIDs(){
    return Object.keys(heroTemplates);  // ids are keys in the template object
}

export function getHeroWithID(id){
    try { return createHeroFromTemplate(id); }
    catch (error){ console.error(error); }
}

export function getHeroPortraitWithID(id){
    try { return heroTemplates[id].portrait; }
    catch (error){ console.error(error); }
}

export function getHeroTeam(){
    return [createHeroFromTemplate(1), createHeroFromTemplate(2), createHeroFromTemplate(4), createHeroFromTemplate(7), createHeroFromTemplate(6)];
}

export function getEnemyTeam(){
    return [createHeroFromTemplate(5), createHeroFromTemplate(6), createHeroFromTemplate(6), createHeroFromTemplate(6), createHeroFromTemplate(5)];
}

// Testing Docs:
/**
 * Creates a new Character object based on template with id.
 * @param  {int} id     ID of the hero
 * @return {Character}  The Character created from the template
 */
export function createHeroFromTemplate(id){
    if (!heroTemplates[id]){
        throw new IllegalArgumentException("Unknown hero: " + id);
    }
    const data = heroTemplates[id];
    const skillIds = data.skillIds;
    const skills = [];
    skillIds.forEach(skillId => skills.push(createSkillFromTemplate(skillId)));

    let passives = [];
    // Build passives:
    if (data.passives) {
        passives = getPassiveObjects(data.passives);
    }

    return new Character(
        data.id,
        data.name,
        data.portrait,
        data.maxHp,
        data.speed,
        skills,
        data.skillPriorities,
        data.resistances,
        passives,
        data.tags,
        data.description,
        data.stats
    );
}

/**
 * Gets the summoning cost for 1 hero.
 * @returns {int} The shard cost of 1 summon
 */
export function getSummonCost(){
    return heroPrice;
}

/**
 * Pulls a random hero from all available ones and returns its ID.
 * @param {Account} account The player Account
 * @param {int} shards Number of shards available
 * @param {int|null} exclude ID to be excluded (prevent duplicates twice in a row)
 * @returns {int} The randomly pulled hero ID
 */
export function pullHero(account, shards, exclude = null){
    if (shards >= heroPrice){
        account.setShards(shards - heroPrice);
        let pool = Object.keys(heroTemplates);
        if (exclude && pool.length > 1){
            pool = pool.filter((id) => id === exclude ? false : true);
        }
        let randInd = Math.floor(Math.random() * pool.length);  // filter out excluded id
        return pool[randInd];
    }
    throw new Error("Insufficient shards!");
}

/**
 * Checks whether or not a hero with a certain ID exists.
 * @param {int} id      The id of a hero to be confirmed to exist
 * @returns {boolean}   Whether hero exists or not
 */
export function validateHeroID(id){
    return heroTemplates[id] ? true : false;
}

const heroPrice = 100;

// Stores templates to create all heros via id.
const heroTemplates = {
    1: {
        id: 1,
        name: "Draconoid - Dark Mage",
        portrait: 'Draconoid - Dark Mage.jpg',
        maxHp: 250,
        speed: 20,
        skillIds: [1, 2, 3, 4],  // References to skillTemplates
        skillPriorities: [3, 2, 1, 0],
        resistances: { fire: 0.5, water: 1.2 },  // Later: multipliers
        passives: null,  // String or object for logic
        tags: ['Dark', 'Debuffs', 'Mage'],
        description: "A shadowy mage who manipulates void energy.",
        stats: {
            'speed': {
                current: 30,
                base: 30
            },
            'hp': {
                current: 250,
                base: 250
            },
            'dmgDealtMult': {
                current: 1.0,
                base: 1.0
            },
            'dmgTakenMult': {
                current: 1.0,
                base: 1.0
            },
            'resistances': {
                'Fire': {
                    current: 0.5,
                    base: 0.5
                },
                'Water': {
                    current: 1.2,
                    base: 1.2
                }
            }
        }
    },
    2: {
        id: 2,
        name: "Blue Dragon Queen",
        portrait: 'Dragon Queen - Blue.jpg',
        maxHp: 450,
        speed: 12,
        skillIds: [1, 2, 3, 4],  // References to skillTemplates
        skillPriorities: [3, 2, 1, 0],
        resistances: { fire: 1.5, water: 1.0 },  // Later: multipliers
        passives: null,  // String or object for logic
        tags: ['Draconoid', 'Mage'],
        description: "A humanoid dragon mage.",
        stats: {
            'speed': {
                current: 12,
                base: 12
            },
            'hp': {
                current: 250,
                base: 250
            },
            'dmgDealtMult': {
                current: 1.0,
                base: 1.0
            },
            'dmgTakenMult': {
                current: 1.0,
                base: 1.0
            },
            'resistances': {
                'Fire': {
                    current: 0.5,
                    base: 0.5
                },
                'Water': {
                    current: 1.2,
                    base: 1.2
                }
            }
        }
    },
    3: {
        id: 3,
        name: "Draconoid Warrior",
        portrait: 'Draconoid - Warrior.jpg',
        maxHp: 550,
        speed: 10,
        skillIds: [1, 2, 3, 4],  // References to skillTemplates
        skillPriorities: [3, 2, 1, 0],
        resistances: { fire: 0.5, water: 1.2, physical: 1.8 },  // Later: multipliers
        passives: null,  // String or object for logic
        tags: ['Fire', 'Physical'],
        description: "A draconoid warrior with plenty of battle experience.",
        stats: {
            'speed': {
                current: 10,
                base: 10
            },
            'hp': {
                current: 250,
                base: 250
            },
            'dmgDealtMult': {
                current: 1.0,
                base: 1.0
            },
            'dmgTakenMult': {
                current: 1.0,
                base: 1.0
            },
            'resistances': {
                'Fire': {
                    current: 0.5,
                    base: 0.5
                },
                'Water': {
                    current: 1.2,
                    base: 1.2
                }
            }
        }
    },
    4: {
        id: 4,
        name: "Poison Dragon Queen",
        portrait: 'Dragon Queen - Poison.jpg',
        maxHp: 350,
        speed: 24,
        skillIds: [11, 12, 13, 14],  // References to skillTemplates
        skillPriorities: [3, 2, 1, 0],
        resistances: { poison: 2.0, water: 1.2, physical: -0.6 },  // Later: multipliers
        passives: null,  // String or object for logic
        tags: ['Poison', 'Debuffer'],
        description: "A draconoid mage gifted in the arts of poison magic.",
        stats: {
            'speed': {
                current: 24,
                base: 24
            },
            'hp': {
                current: 250,
                base: 250
            },
            'dmgDealtMult': {
                current: 1.0,
                base: 1.0
            },
            'dmgTakenMult': {
                current: 1.0,
                base: 1.0
            },
            'resistances': {
                'Fire': {
                    current: 0.5,
                    base: 0.5
                },
                'Water': {
                    current: 1.2,
                    base: 1.2
                }
            }
        }
    },
    5: {
        id: 5,
        name: "Necromancer",
        portrait: 'Draconoid - Necromancer.jpg',
        maxHp: 250,
        speed: 18,
        skillIds: [1, 2, 3, 4],  // References to skillTemplates
        skillPriorities: [3, 2, 1, 0],
        resistances: { poison: 2.0, dark: 2.2, physical: -0.6 },  // Later: multipliers
        passives: null,  // String or object for logic
        tags: ['Dark', 'CC', 'AoE'],
        description: "A draconoid necromancer able to wield dark magic to devastate oponents.",
        stats: {
            'speed': {
                current: 18,
                base: 18
            },
            'hp': {
                current: 250,
                base: 250
            },
            'dmgDealtMult': {
                current: 1.0,
                base: 1.0
            },
            'dmgTakenMult': {
                current: 1.0,
                base: 1.0
            },
            'resistances': {
                'Fire': {
                    current: 0.5,
                    base: 0.5
                },
                'Water': {
                    current: 1.2,
                    base: 1.2
                }
            }
        }
    },
    6: {
        id: 6,
        name: "Rakthir",
        portrait: 'Rakthir.jpg',
        maxHp: 650,
        speed: 22,
        skillIds: [1, 6, 7, 8],
        skillPriorities: [3, 2, 1, 0],
        resistances: { physical: 0.8, fire: 1.0 },
        passives: [
            { type: 'DebuffImmunity', params: { debuffNames: ['Scared'] } },
        ],
        tags: ['Fire', 'Physical', 'Warrior'],
        description: "A fierce draconoid warrior with an eternal hatred towards mages. His only goal: Eradicate all magic in this world.",
        stats: {
            'speed': {
                current: 22,
                base: 22
            },
            'hp': {
                current: 250,
                base: 250
            },
            'dmgDealtMult': {
                current: 1.0,
                base: 1.0
            },
            'dmgTakenMult': {
                current: 1.0,
                base: 1.0
            },
            'resistances': {
                'Fire': {
                    current: 0.5,
                    base: 0.5
                },
                'Water': {
                    current: 1.2,
                    base: 1.2
                }
            }
        }
    },
    7: {
        id: 7,
        name: "Kresh",
        portrait: 'Kresh.jpg',
        maxHp: 650,
        speed: 28,
        skillIds: [1, 10, 9, 15],
        skillPriorities: [3, 2, 1, 0],
        resistances: { physical: 0.8, fire: 1.0 },
        passives: null,
        tags: ['Support', 'Physical', 'Warrior'],
        description: "An experienced combat veteran now commanding his troops and turning the tides of a battle with cunning abilities.",
        stats: {
            'speed': {
                current: 28,
                base: 28
            },
            'hp': {
                current: 250,
                base: 250
            },
            'dmgDealtMult': {
                current: 1.0,
                base: 1.0
            },
            'dmgTakenMult': {
                current: 1.0,
                base: 1.0
            },
            'resistances': {
                'Fire': {
                    current: 0.5,
                    base: 0.5
                },
                'Water': {
                    current: 1.2,
                    base: 1.2
                }
            }
        }
    },
};