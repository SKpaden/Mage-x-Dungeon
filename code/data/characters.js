import { Debuff } from "../game/debuffs.js";
import { Effect } from "../game/effects.js";
import { createSkillFromTemplate, Skill } from "./skills.js";
import { DealDamage, FullCleanse, IncreaseCD, ResetCD} from "./skillParts.js";
import { StatManager } from "./statManager.js";

export class Character{
    constructor(id, name, portrait, maxHp, speed, skills, skillPriorities, resistences, passive, tags, description, stats){  // add id maybe
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
        this.passive = passive;
        this.tags = tags;
        this.description = description;
        this.statManager = new StatManager(stats);
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

    // Draws the turn meter under the character's portrait with the new value.
    updateTurnMeter(scene, container, value){
        // TODO:

    }

    // Reduces cooldown of all skills by 1 turn. Call at the end of round.
    reduceCooldowns(){
        this.skills.forEach((skill) => skill.decreaseCD());
    }

    resetCDs(){
        // Potential effects that deny reset here ==> return false.
        this.skills.forEach((skill) => skill.currentCD = 0);
        return true;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CREATE HEROS FROM TEMPLATES:

export function getHeroTeam(){
    return [createHeroFromTemplate(1), createHeroFromTemplate(2), createHeroFromTemplate(4), createHeroFromTemplate(7), createHeroFromTemplate(6)];
}

export function getEnemyTeam(){
    return [createHeroFromTemplate(5), createHeroFromTemplate(6), createHeroFromTemplate(6), createHeroFromTemplate(6), createHeroFromTemplate(5)];
}

function createHeroFromTemplate(id){
    if (!heroTemplates[id]){
        throw new IllegalArgumentException("Unknown hero: " + id);
    }
    const data = heroTemplates[id];
    const skillIds = data.skillIds;
    const skills = [];
    skillIds.forEach(skillId => skills.push(createSkillFromTemplate(skillId)));

    return new Character(
        data.id,
        data.name,
        data.portrait,
        data.maxHp,
        data.speed,
        skills,
        data.skillPriorities,
        data.resistances,
        data.passive,
        data.tags,
        data.description,
        data.stats
    );
}

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
        passive: null,  // String or object for logic
        tags: ['Dark', 'Mage'],
        description: "A shadowy mage who manipulates void energy.",
        stats: {
            'speed': {
                current: 20,
                base: 20
            },
            'hp': {
                current: 250,
                base: 250
            },
            'dmgMult': {
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
        passive: null,  // String or object for logic
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
            'dmgMult': {
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
        passive: null,  // String or object for logic
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
            'dmgMult': {
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
        passive: null,  // String or object for logic
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
            'dmgMult': {
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
        passive: null,  // String or object for logic
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
            'dmgMult': {
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
        passive: null,
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
            'dmgMult': {
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
        passive: null,
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
            'dmgMult': {
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