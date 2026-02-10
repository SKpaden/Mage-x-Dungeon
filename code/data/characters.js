export class Character{
    constructor(name, portrait, maxHp, speed, skills, skillPriorities, resistences, passive, tags){
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