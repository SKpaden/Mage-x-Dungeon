import { Skill } from "./skills.js";

export class Character{
    constructor(name, portrait, maxHp, speed, skills, skillPriorities, resistences, passive, tags, description){  // add id maybe
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
        var i = 0;
        var skill = this.skills[i];
        while (skill.cooldown > 0){
            i++;
            skill = this.skills[i];
        }
        return skill;
    }

    // Reduces cooldown of all skills by 1 turn. Call at the end of round.
    reduceCooldowns(){
        this.skills.forEach((skill) => skill.decreaseCD());
    }
}


const hero1 = {
    name: "Draconoid Mage",
    portrait: 'Draconoid - Dark Mage.jpg',
    maxHp: 250,
    speed: 20,
    skills: [
        // Claw Strike:
        new Skill('Claw Strike', 'Claw Strike.jpg', 'single',
                    new Effect(60, null, null, "Physical"),
                    0, "Strikes an enemy with his claw dealing physical damage."),

        // Fireball
        new Skill('Fireball', 'Fireball.jpg', 'single',
                    new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
                    3, "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions.")
    ],
    skillPriorities: [1,0],
    resitences: null,
    passive: null,
    tags: ['Fire', 'Physical'],
    description: "Descr placeholder for name1."
}