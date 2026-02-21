import { Debuff } from "../game/debuffs.js";
import { Effect } from "../game/effects.js";
import { createSkillFromTemplate, Skill } from "./skills.js";
import { DealDamage, FullCleanse, IncreaseCD, ResetCD} from "./skillParts.js";

export class Character{
    constructor(id, name, portrait, maxHp, speed, skills, skillPriorities, resistences, passive, tags, description){  // add id maybe
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

    // Returns the speed.
    getSpeed(){
        return this.speed;
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
    return [createHeroFromTemplate(1), createHeroFromTemplate(2), createHeroFromTemplate(3), createHeroFromTemplate(7), createHeroFromTemplate(6)];
}

export function getEnemyTeam(){
    return [createHeroFromTemplate(5), createHeroFromTemplate(6), createHeroFromTemplate(6), createHeroFromTemplate(6), createHeroFromTemplate(5)];
}

function createHero1(){
    return new Character(1, "Draconoid Mage", 'Draconoid - Dark Mage.jpg', 250, 20,
        // Skills:
        [
            // Claw Strike:
            new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, null, null, "Physical", '#8f8e8e'),
                            skillName: 'Claw Strike'
                        })],
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, 'Fire', new Debuff("Burn", 2, 20, "Fire", null, false, "elemental", null), "Fire"),
                            skillName: 'Fireball'
                        })],
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(0, 'Light', new Debuff("Blinded", 3, 0, "Light", null, false, "elemental", null), "Light", '#f0ff20'),
                            skillName: 'Holy Light'
                        })],
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        [new DealDamage({
                            area: 'all',
                            effect: new Effect(25, 'Dark', new Debuff("Scared", 1, 0, "Dark", null, true, "cc", null), "Dark", '#b700ff'),
                            skillName: 'Dark Nova',
                        })],
                        5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
            )
        ],
        [3, 2, 1, 0],
        null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
    );
}

function createHero2(){
    return new Character(2, "Blue Dragon Queen", 'Dragon Queen - Blue.jpg', 450, 12,
        // Skills:
        [
            // Claw Strike:
            new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, null, null, "Physical", '#8f8e8e'),
                            skillName: 'Claw Strike'
                        })],
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, 'Fire', new Debuff("Burn", 2, 20, "Fire", null, false, "elemental", null), "Fire"),
                            skillName: 'Fireball'
                        })],
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(0, 'Light', new Debuff("Blinded", 3, 0, "Light", null, false, "elemental", null), "Light", '#f0ff20'),
                            skillName: 'Holy Light'
                        })],
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        [new DealDamage({
                            area: 'all',
                            effect: new Effect(25, 'Dark', new Debuff("Scared", 1, 0, "Dark", null, true, "cc", null), "Dark", '#b700ff'),
                            skillName: 'Dark Nova',
                        })],
                        5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
            )
        ],
        [3, 2, 1, 0],
        null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
    );
}

function createHero3(){
    return new Character(3, "Draconoid Warrior", 'Draconoid - Warrior.jpg', 550, 10,
        // Skills:
        [
            // Claw Strike:
            new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, null, null, "Physical", '#8f8e8e'),
                            skillName: 'Claw Strike'
                        })],
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, 'Fire', new Debuff("Burn", 2, 20, "Fire", null, false, "elemental", null), "Fire"),
                            skillName: 'Fireball'
                        })],
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(0, 'Light', new Debuff("Blinded", 3, 0, "Light", null, false, "elemental", null), "Light", '#f0ff20'),
                            skillName: 'Holy Light'
                        })],
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        [new DealDamage({
                            area: 'all',
                            effect: new Effect(25, 'Dark', new Debuff("Scared", 1, 0, "Dark", null, true, "cc", null), "Dark", '#b700ff'),
                            skillName: 'Dark Nova',
                        })],
                        5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
            )
        ],
        [3, 2, 1, 0],
        null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
    );
}

function createHero4(){
    return new Character(4, "Poison Dragon Queen", 'Dragon Queen - Poison.jpg', 350, 13,
        // Skills:
        [
            // Claw Strike:
            new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, null, null, "Physical", '#8f8e8e'),
                            skillName: 'Claw Strike'
                        })],
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, 'Fire', new Debuff("Burn", 2, 20, "Fire", null, false, "elemental", null), "Fire"),
                            skillName: 'Fireball'
                        })],
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(0, 'Light', new Debuff("Blinded", 3, 0, "Light", null, false, "elemental", null), "Light", '#f0ff20'),
                            skillName: 'Holy Light'
                        })],
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        [new DealDamage({
                            area: 'all',
                            effect: new Effect(25, 'Dark', new Debuff("Scared", 1, 0, "Dark", null, true, "cc", null), "Dark", '#b700ff'),
                            skillName: 'Dark Nova',
                        })],
                        5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
            )
        ],
        [3, 2, 1, 0],
        null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
    );
}

export function createHero5(){
    return new Character(5, "Necromancer", 'Draconoid - Necromancer.jpg', 250, 18,
        // Skills:
        [
            // Claw Strike:
            new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, null, null, "Physical", '#8f8e8e'),
                            skillName: 'Claw Strike'
                        })],
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(60, 'Fire', new Debuff("Burn", 2, 20, "Fire", null, false, "elemental", null), "Fire"),
                            skillName: 'Fireball'
                        })],
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        [new DealDamage({
                            area: 'single',
                            effect: new Effect(0, 'Light', new Debuff("Blinded", 3, 0, "Light", null, false, "elemental", null), "Light", '#f0ff20'),
                            skillName: 'Holy Light'
                        })],
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        [new DealDamage({
                            area: 'all',
                            effect: new Effect(25, 'Dark', new Debuff("Scared", 1, 0, "Dark", null, true, "cc", null), "Dark", '#b700ff'),
                            skillName: 'Dark Nova',
                        })],
                        5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
            )
        ],
        [3, 2, 1, 0],
        null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
    );
}

function createHero6(){
    return new Character(5, "Rakthir", 'Rakthir.jpg', 650, 22,
        // Skills:
        [
            // Claw Strike:
            new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
                        [new DealDamage({area: 'single', effect: new Effect(60, null, null, "Physical", '#8f8e8e'), skillName: 'Claw Strike'})],
                        0, "Strikes an enemy with his claw dealing physical damage."),
            // Revenge:
            new Skill('Revenge', 'Revenge.jpg', 'all',
                        [new DealDamage({ area: 'all', effect: new Effect(120, null, null, "Physical", '#8f8e8e'), skillName: 'Revenge'})],
                        3, "A powerful physical AoE attack."),
            // Intimidate:
            new Skill('Intimidate', 'Intimidate.jpg', 'all',
                        [
                            new IncreaseCD({ area: 'all'})
                        ],
                        4, "Puts all enemy skills on cooldown."
            ),
            // War Cry:
            new Skill('War Cry', 'War Cry.jpg', 'all',
                        [
                            //new FullCleanse({ area: 'single'}),
                            new ResetCD({ area: 'all'}),
                            new FullCleanse({ area: 'all'}),
                        ],
                        5, "Resets all ally skill cooldowns and removes all debuffs from all allies.", 'Support'
            )
        ],
        [3, 2, 1, 0],
        null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
    );
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
        data.description
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
        description: "A shadowy mage who manipulates void energy."
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
        description: "A humanoid dragon mage."
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
        description: "A draconoid warrior with plenty of battle experience."
    },
    4: {
        id: 4,
        name: "Poison Dragon Queen",
        portrait: 'Dragon Queen - Poison.jpg',
        maxHp: 350,
        speed: 13,
        skillIds: [1, 2, 3, 4],  // References to skillTemplates
        skillPriorities: [3, 2, 1, 0],
        resistances: { poison: 2.0, water: 1.2, physical: -0.6 },  // Later: multipliers
        passive: null,  // String or object for logic
        tags: ['Poison', 'Debuffer'],
        description: "A draconoid mage gifted in the arts of poison magic."
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
        description: "A draconoid necromancer able to wield dark magic to devastate oponents."
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
        description: "A fierce draconoid warrior with an eternal hatred towards mages. His only goal: Eradicate all magic in this world."
    },
    7: {
        id: 7,
        name: "Kresh",
        portrait: 'Kresh.jpg',
        maxHp: 650,
        speed: 28,
        skillIds: [1, 6, 9, 10],
        skillPriorities: [3, 2, 1, 0],
        resistances: { physical: 0.8, fire: 1.0 },
        passive: null,
        tags: ['Support', 'Physical', 'Warrior'],
        description: "A fierce draconoid warrior with an eternal hatred towards mages. His only goal: Eradicate all magic in this world."
    },
};