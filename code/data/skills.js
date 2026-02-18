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
                { className: 'DealDamage', params: {
                                            area: 'single',
                                            effect: new Effect(0, 'Light', new Debuff("Blinded", 3, 0, "Light", null, false, "elemental", null), "Light", '#f0ff20'),
                                            skillName: 'Holy Light'
                                        }
                }
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
        // Poison Cloud:
        10: {
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
    };

    return skillTemplates;
}