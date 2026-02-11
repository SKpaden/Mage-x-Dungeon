import { Debuff } from "../game/debuffs.js";
import { Effect } from "../game/effects.js";

export class Skill{
    constructor(name, icon, targets, effect, cooldown, dsecription){
        this.name = name;
        this.icon = icon;
        this.targets = targets;
        this.effect = effect;
        this.cooldown = cooldown;
        this.currentCD = 0;

        this.dsecription = dsecription;
    }
    // Creates and return the Skill's icon.
    addIcon(scene, x, y, scale){
        if (this.currentCD) return scene.add.image(x, y, this.icon).setScale(scale).setTint(0x202020);
        return scene.add.image(x, y, this.icon).setScale(scale);
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

// const clawstrike = {
//     name: 'Claw Strike',
//     icon: 'Claw Strike.jpg',
//     targets: 'single',
//     effect: new Effect(50, null, null, 'Physical'),
//     cooldown: 0,
//     description: "Strikes an enemy with his claw dealing physical damage."
// }

// const fireball = {
//     name: 'Fireball',
//     icon: 'Fireball.jpg',
//     targets: 'single',
//     effect: new Effect(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental", null), "Fire"),
//     cooldown: 3,
//     description: "A powerful single-target fire ability. Can trigger all Fire-based elemental reactions."
// }

// const poisonClaw = {
//     name: 'Poison Claw',
//     icon: 'Poison Claw.jpg',
//     targets: 'single',
//     effect: new Effect(40, 'poison', new Debuff("Poison", 3, 25, "poison", null, false, "elemental", null), "Poison", '#0fee65'),
//     cooldown: 0,
//     description: "A single-target Poison attack. Applies a Posion debuff."
// }

// const darkNova = {
//     name: 'Dark Nova',
//     icon: 'Dark Nova.jpg',
//     targets: 'all',
//     effect: new Effect(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc", null), "Dark", '#b700ff'),
//     cooldown: 5,
//     description: "A powerful AoE ability that invokes fear in anyone affected. Due to it's sheer power, it cannot be used often."
// }

// const holyLight = {
//     name: 'Holy Light',
//     icon: 'Holy Light.jpg',
//     targets: 'single',
//     effect: new Effect(0, 'light', new Debuff("Blinded", 3, 0, "light", null, false, "elemental", null), "Light", '#f0ff20'),
//     cooldown: 2,
//     description: "Blinds a single target for 3 turns."
// }