import { updateHP } from "../ui/portraitFactory.js";
import { uiStats } from "../ui/uiStats.js";

export class Debuff{
    constructor(name, duration, dmgPerTurn = 0, element = null, triggerEffect = null, skipTurn = false, type = "elemental"){
        this.name = name;
        this.duration = duration;
        this.dmgPerTurn = dmgPerTurn;
        this.element = element;  // for reactions
        this.triggerEffect = triggerEffect;  // probably remove this...don't know if this makes sense
        this.skipTurn = skipTurn;
        this.type = type;

        // For later display:
        this.description = "No description!";
        this.icon = null;  // TODO
        this.text = "Debuff Text";
        this.textColor = '#ED0000';
    }   

    // Debuffs that can be applied mutliple times to one enemy:
    static stackingDebuffs = ['Poison'];

    // Checks if a debuff is allowed to be added to a debuff list.
    static allowDebuff(debuffs, name){
        const contains = Debuff.containsDebuff(debuffs, name);
        if(contains && Debuff.stackingDebuffs.includes(name) || !contains){  // present AND stacking OR not present
            return true;
        }
        return false;
    }

    // Checks if a debuff list contains a debuff with name.
    static containsDebuff(debuffs, name){
        var contains = false;
        debuffs.forEach(element => {
            if (element.name === name) contains = true;
        });
        return contains;
    }

    // Returns reaction of debuff with element or null.
    static getReaction(debuff, element){
        if (element === 'fire') return Debuff.fireReactions(debuff);  // maybe as lookup arrays [debuff.name] ==> also for multipliers/dmg
        if (element === 'eletro') return Debuff.electroReactions(debuff);
        if (element === 'water') return Debuff.waterReactions(debuff);
        if (element === 'dark') return Debuff.darkReactions(debuff);
        if (element === 'holy') return Debuff.holyReactions(debuff);
        if (element === 'ice') return Debuff.iceReactions(debuff);
        if (element === 'poison') return Debuff.poisonReactions(debuff);
        if (element === 'blood') return Debuff.bloodReactions(debuff);
        return null;
    }

    // Shows debuff popup. (ISSUE: Need async stuff (Promise) to not display all at once!)
    static showDebuffPopup(scene, x, y, debuffs, index){
        if (index >= debuffs.length) return;
        const dmgPT = debuffs[index].dmgPerTurn;
        const textColor = debuffs[index].textColor;
        const text = debuffs[index].name;
        let displayText = dmgPT ? `-${dmgPT}\n`+text : text;

        const debuffText = scene.add.text(x, y, displayText, {fontSize: uiStats.dmgPopupFontsize, color: textColor}).setOrigin(0.5);
        scene.tweens.add({
            targets: debuffText,
            y: '-=100',
            alpha: 0.4,
            duration: 600,
            onComplete: () => {
                debuffText.destroy();
                this.showDebuffPopup(scene, x, y, debuffs, index+1);
            }
        });
    }

    // Shows debuff popup. (ISSUE: Need async stuff (Promise) to not display all at once!)
    showDebuffPopupAsync(scene, x, y){
        const dmgPT = this.dmgPerTurn;
        const textColor = this.textColor;
        const text = this.name;
        let displayText = dmgPT ? `-${dmgPT}\n`+text : text;

        const debuffText = scene.add.text(x, y, displayText, {fontSize: uiStats.dmgPopupFontsize, color: textColor}).setOrigin(0.5);
        scene.tweens.add({
            targets: debuffText,
            y: '-=100',
            alpha: 0.4,
            duration: uiStats.debuffDelay,
            onComplete: () => {
                debuffText.destroy();
            }
        });
    }

    // Return a new instance of Debuff with the exact same stats.
    createCopy(){
        return new Debuff(this.name, this.duration, this.dmgPerTurn, this.element, this.triggerEffect, this.skipTurn, this.type);
    }

    // Check if this debuff prevents a turn.
    skip(){
        return this.skipTurn;
    }

    // Activates debuff's effect/dmg on target.
    tick(scene, target){
        if(this.dmgPerTurn > 0){
            const currentHp = target.getData('hp');
            const newHp = Math.max(0, currentHp - this.dmgPerTurn);
            target.setData('hp', newHp);
            updateHP(target, newHp);
        }
        if (this.triggerEffect) {
            // Trigger extra effect if set (TODO):
            this.triggerEffect.applyTo(target);
        }
        this.duration-=1;
        return this.duration > 0;
    }
}

export class Burn extends Debuff {
    constructor(duration, dmgPerTurn) {
        super('Burn', duration, dmgPerTurn, 'fire', null);  // element = fire
    }

    tick(target) {
        super.tick(target);
        // Custom trigger: if target has shock, create Explosion
        const debuffs = target.getData('debuffs') || [];
        if (debuffs.some(d => d.name === 'Shock')) {
            const explosion = new Explosion(100);
            explosion.applyTo(target);
        }
    }
}