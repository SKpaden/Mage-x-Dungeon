import { Debuff } from "../game/debuffs.js";
import { Effect } from "../game/effects.js";
import { Skill } from "./skills.js";

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

    // Draws the turn meter under the character's portrait with the new value.
    updateTurnMeter(scene, container, value){
        // TODO:

    }

    // Reduces cooldown of all skills by 1 turn. Call at the end of round.
    reduceCooldowns(){
        this.skills.forEach((skill) => skill.decreaseCD());
    }
}

export function getHeroTeam(){
    return [createHero1(), createHero2(), createHero3(), createHero4(), createHero5()];
}

// export const hero1 = {
//     id: 1,
//     name: "Draconoid Mage",
//     portrait: 'Draconoid - Dark Mage.jpg',
//     maxHp: 250,
//     speed: 20,
//     skills: [
//         // Claw Strike:
//         new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
//                     new Effect(60, null, null, "Physical"),
//                     0, "Strikes an enemy with his claw dealing physical damage."),

//         // Fireball
//         new Skill('Fireball', 'Fireball.jpg', 'single',
//                     new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
//                     3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions.")
//     ],
//     skillPriorities: [1,0],
//     resitences: null,
//     passive: null,
//     tags: ['Fire', 'Physical'],
//     description: "Descr placeholder for name1."
// }
function createHero1(){
    return new Character(1, "Draconoid Mage", 'Draconoid - Dark Mage.jpg', 250, 20,
        // Skills:
        [
            // Claw Strike:
            new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
                        new Effect(60, null, null, "Physical", '#8f8e8e'),
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
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
                        new Effect(60, null, null, "Physical", '#8f8e8e'),
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
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
                        new Effect(60, null, null, "Physical", '#8f8e8e'),
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
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
                        new Effect(60, null, null, "Physical", '#8f8e8e'),
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
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
                        new Effect(60, null, null, "Physical", '#8f8e8e'),
                        0, "Strikes an enemy with his claw dealing physical damage."),

            // Fireball
            new Skill('Fireball', 'Fireball.jpg', 'single',
                        new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
                        3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
            // Holy Light:
            new Skill('Holy Light', 'Holy Light.jpg', 'single',
                        new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
                        2, "Blinds a single target for 3 turns."
            ),
            // Dark Nova:
            new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
                        new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
                        5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
            )
        ],
        [3, 2, 1, 0],
        null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
    );
}


// export const hero1 = new Character(1, "Draconoid Mage", 'Draconoid - Dark Mage.jpg', 250, 20,
//     // Skills:
//     [
//         // Claw Strike:
//         new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
//                     new Effect(60, null, null, "Physical", '#8f8e8e'),
//                     0, "Strikes an enemy with his claw dealing physical damage."),

//         // Fireball
//         new Skill('Fireball', 'Fireball.jpg', 'single',
//                     new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
//                     3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
//         // Holy Light:
//         new Skill('Holy Light', 'Holy Light.jpg', 'single',
//                     new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
//                     2, "Blinds a single target for 3 turns."
//         ),
//         // Dark Nova:
//         new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
//                     new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
//                     5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
//         )
//     ],
//     [3, 2, 1, 0],
//     null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
// )

// export const hero2 = new Character(2, "Blue Dragon Queen", 'Dragon Queen - Blue.jpg', 450, 12,
//     // Skills:
//     [
//         // Claw Strike:
//         new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
//                     new Effect(60, null, null, "Physical", '#8f8e8e'),
//                     0, "Strikes an enemy with his claw dealing physical damage."),

//         // Fireball
//         new Skill('Fireball', 'Fireball.jpg', 'single',
//                     new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
//                     3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
//         // Holy Light:
//         new Skill('Holy Light', 'Holy Light.jpg', 'single',
//                     new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
//                     2, "Blinds a single target for 3 turns."
//         ),
//         // Dark Nova:
//         new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
//                     new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
//                     5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
//         )
//     ],
//     [3, 2, 1, 0],
//     null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
// )

// export const hero3 = new Character(3, "Draconoid Warrior", 'Draconoid - Warrior.jpg', 550, 10,
//     // Skills:
//     [
//         // Claw Strike:
//         new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
//                     new Effect(60, null, null, "Physical", '#8f8e8e'),
//                     0, "Strikes an enemy with his claw dealing physical damage."),

//         // Fireball
//         new Skill('Fireball', 'Fireball.jpg', 'single',
//                     new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
//                     3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
//         // Holy Light:
//         new Skill('Holy Light', 'Holy Light.jpg', 'single',
//                     new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
//                     2, "Blinds a single target for 3 turns."
//         ),
//         // Dark Nova:
//         new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
//                     new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
//                     5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
//         )
//     ],
//     [3, 2, 1, 0],
//     null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
// )

// export const hero4 = new Character(4, "Poison Dragon Queen", 'Dragon Queen - Poison.jpg', 350, 13,
//     // Skills:
//     [
//         // Claw Strike:
//         new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
//                     new Effect(60, null, null, "Physical", '#8f8e8e'),
//                     0, "Strikes an enemy with his claw dealing physical damage."),

//         // Fireball
//         new Skill('Fireball', 'Fireball.jpg', 'single',
//                     new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
//                     3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
//         // Holy Light:
//         new Skill('Holy Light', 'Holy Light.jpg', 'single',
//                     new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
//                     2, "Blinds a single target for 3 turns."
//         ),
//         // Dark Nova:
//         new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
//                     new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
//                     5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
//         )
//     ],
//     [3, 2, 1, 0],
//     null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
// )

// export const hero5 = new Character(5, "Necromancer", 'Draconoid - Necromancer.jpg', 250, 18,
//     // Skills:
//     [
//         // Claw Strike:
//         new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
//                     new Effect(60, null, null, "Physical", '#8f8e8e'),
//                     0, "Strikes an enemy with his claw dealing physical damage."),

//         // Fireball
//         new Skill('Fireball', 'Fireball.jpg', 'single',
//                     new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
//                     3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."),
//         // Holy Light:
//         new Skill('Holy Light', 'Holy Light.jpg', 'single',
//                     new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
//                     2, "Blinds a single target for 3 turns."
//         ),
//         // Dark Nova:
//         new Skill('Dark Nova', 'Dark Nova.jpg', 'all',
//                     new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
//                     5, "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
//         )
//     ],
//     [3, 2, 1, 0],
//     null, null, ['Fire', 'Physical'], "Descr placeholder for name1."
// )

// export const heroesStatic = [hero1, hero2, hero3, hero4, hero5];
