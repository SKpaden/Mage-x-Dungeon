import { createActionFromTemplate } from "./skillParts.js";
import { Debuff } from "../game/debuffs.js";
import { Effect } from "../game/effects.js";
import { delay } from "../ui/helpers.js";
import { uiStats } from "../ui/uiStats.js";

export class Skill{
    constructor(name, icon, targets, actions, cooldown, description, type = 'Attack'){
        this.name = name;
        this.icon = icon;
        this.targets = targets;
        this.actions = actions;  // new part
        this.cooldown = cooldown;
        this.currentCD = 0;

        this.description = description;
        this.type = type;  // differentiate between support = target allies, attack = target enemies, revive = target dead allies
    }

    // Creates and return the Skill's icon.
    addIcon(scene, x, y, scale){
        if (this.currentCD) return scene.add.image(x, y, this.icon).setScale(scale).setTint(0x202020);
        return scene.add.image(x, y, this.icon).setScale(scale);
    }

    // Apply skill method, unique to every skill ==> override.
    async apply(scene, source, target, index, allies, enemies){
        for (let i = 0; i < this.actions.length; i++){
            await this.actions[i].execute(scene, source, target, index, allies, enemies);
            if (i < this.actions.length-1) await delay(scene, uiStats.debuffDelay);  // no delay after last action
        }
    }

    // Chooses target based on skill type.
    chooseTarget(scene, source, allies, enemies){
        let minHp = 999;
        let chosenTarget;
        if (this.type === 'Support'){
            allies.forEach(container => {
                const hp = container.getData('hp');
                if (hp && hp < minHp){  // > 0, but smallest ==> === 0 only for revive skills (later)
                    minHp = hp;
                    chosenTarget = container;
                }
            })
        } else if (this.type === 'Revive'){
            return;
        } else {
            enemies.forEach(container => {
                const hp = container.getData('hp');
                if (hp && hp < minHp){  // > 0, but smallest ==> === 0 only for revive skills (later)
                    minHp = hp;
                    chosenTarget = container;
                }
            })
        }
        return chosenTarget;
    }

    // Decreases CD by one turn.
    decreaseCD(){
        if (this.cooldown && this.currentCD) this.currentCD--;
    }

    // Sets skill on CD.
    putCooldown(){
        if (this.cooldown) this.currentCD = this.cooldown;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CREATE SKILLS FROM TEMPLATES:

// Templates of all Skills to dynamically create them:
let skillTemplates = null;

// Creates and returns a Skill from a template.
export function createSkillFromTemplate(id){
    const skillTemplates = getSkillTemplates();
    if (!skillTemplates[id]){
        throw new IllegalArgumentException("Unknown skill: " + id);
    }
    const data = skillTemplates[id];
    const actionData = data.actions;
    const actions = [];
    actionData.forEach(action => actions.push(createActionFromTemplate(action)));

    return new Skill(
        data.name,
        data.icon,
        data.targets,
        actions,
        data.cooldown,
        data.description,
        data.type
    );
}

export function getSkillTemplates(){
    if (skillTemplates) return skillTemplates;
    skillTemplates = {
        // Claw Strike:
        1: {
            name: 'Claw Strike',
            icon: 'Claw Strike.jpg',
            targets: 'single',
            actions: [
                { className: 'DealDamage', params: {
                                            area: 'single',
                                            effect: new Effect(60, null, null, "Physical", '#8f8e8e'),
                                            skillName: 'Claw Strike'
                                        }
                }
            ],
            cooldown: 0,
            description: "Strikes an enemy with his claw dealing physical damage."
        },
        // Fireball:
        2: {
            name: 'Fireball',
            icon: 'Fireball.jpg',
            targets: 'single',
            actions: [
                { className: 'DealDamage', params: {
                                            area: 'single',
                                            effect: new Effect(60, 'Fire', new Debuff("Burn", 2, 20, "Fire", null, false, "elemental", null), "Fire"),
                                            skillName: 'Fireball'
                                        }
                }
            ],
            cooldown: 3,
            description: "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."
        },
        // Holy Light:
        3: {
            name: 'Holy Light',
            icon: 'Holy Light.jpg',
            targets: 'single',
            actions: [
                { className: 'ApplyDebuff', params: { area: 'single', debuff: new Debuff("Blinded", 3, 0, "Light", null, false, "elemental", null) } }
            ],
            cooldown: 2,
            description: "Blinds a single target for 3 turns."
        },
        // Dark Nova:
        4: {
            name: 'Dark Nova',
            icon: 'Dark Nova.jpg',
            targets: 'all',
            actions: [
                { className: 'DealDamage', params: {
                                            area: 'all',
                                            effect: new Effect(25, 'Dark', new Debuff("Scared", 1, 0, "Dark", null, true, "cc", null), "Dark", '#b700ff'),
                                            skillName: 'Dark Nova'
                                        }
                }
            ],
            cooldown: 5,
            description: "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
        },
        // Revenge:
        6: {
            name: 'Revenge',
            icon: 'Revenge.jpg',
            targets: 'all',
            actions: [
                { className: 'DealDamage', params: {
                                        area: 'all',
                                        effect: new Effect(120, null, null, "Physical", '#8f8e8e'),
                                        skillName: 'Revenge'
                                    }
                }
            ],
            cooldown: 3,
            description: "A powerful physical AoE attack."
        },
        // Intimidate:
        7: {
            name: 'Intimidate',
            icon: 'Intimidate.jpg',
            targets: 'all',
            actions: [
                { className: 'IncreaseCD', params: { area: 'all'} }
            ],
            cooldown: 4,
            description: "Puts all enemy skills on cooldown."
        },
        // War Cry:
        8: {
            name: 'War Cry',
            icon: 'War Cry.jpg',
            targets: 'all',
            actions: [
                { className: 'ResetCD', params: { area: 'all' } },
                { className: 'FullCleanse', params: { area: 'all' } }
            ],
            cooldown: 5,
            description: "Resets all ally skill cooldowns and removes all debuffs from all allies.",
            type: 'Support'
        },
        // Dash:
        9: {
            name: 'Dash',
            icon: 'Dash.jpg',
            targets: 'all',
            actions: [
                { className: 'BoostTurnMeter', params: { area: 'all', amount: 0.3 } },
            ],
            cooldown: 3,
            description: "Boosts turn meter of all allies by 30%.",
            type: 'Support'
        },
        // Ally Attack:
        10: {
            name: 'Ally Attack',
            icon: 'Ally Attack.jpg',
            targets: 'single',
            actions: [
                { className: 'AllyAttack', params: { amount: 'all' } },
            ],
            cooldown: 5,
            description: "Attacks an enemy with all allies.",
        },
        // Poison Claw:
        11: {
            name: 'Poison Claw',
            icon: 'Poison Claw.jpg',
            targets: 'single',
            actions: [
                { className: 'DealDamage', params: {
                                            area: 'single',
                                            effect: new Effect(20, 'Poison', new Debuff('Poison', 2, 50, 'Poison', null, false, 'elemental', null), "Poison"),
                                            skillName: 'Poison Claw'
                                        }
                }
            ],
            cooldown: 3,
            description: "Places a Poison debuff on adjacent targets for 5 turns.",
        },
        // Poison Bomb:
        12: {
            name: 'Poison Bomb',
            icon: 'Poison Bomb.jpg',
            targets: 'adjacent',
            actions: [
                { className: 'ApplyDebuff', params: { area: 'adjacent', debuff: new Debuff('Poison', 5, 50, 'Poison', null, false, 'elemental', null) } },
            ],
            cooldown: 3,
            description: "Places a Poison debuff on adjacent targets for 5 turns.",
        },
        // Poison Cloud:
        13: {
            name: 'Poison Cloud',
            icon: 'Poison Cloud.jpg',
            targets: 'all',
            actions: [
                { className: 'ApplyDebuff', params: { area: 'all', debuff: new Debuff('Poison', 3, 50, 'Poison', null, false, 'elemental', null) } },
            ],
            cooldown: 3,
            description: "Places a Poison debuff on all enemies.",
            //type: 'Debuff'
        },
        // Poison Activation:
        14: {
            name: 'Poison Activation',
            icon: 'Poison Activation.jpg',
            targets: 'all',
            actions: [
                { className: 'ActivatePoison', params: { area: 'all' } },
            ],
            cooldown: 3,
            description: "Activates all Poison debuffs on all enemies.",
        },
        // Endless Suffering:
        15: {
            name: 'Endless Suffering',
            icon: 'Endless Suffering.jpg',
            targets: 'all',
            actions: [
                { className: 'IncreaseDebuffDuration', params: { area: 'all' , amount: 2} },
            ],
            cooldown: 3,
            description: "Increases the duration of all enemy debuffs by 2 turns.",
        },
    };

    return skillTemplates;
}