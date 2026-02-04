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

    // Shows debuff popup. (ISSUE: Need async stuff (Promise) to not display all at once!)
    static showDebuffPopup(scene, x, y, text, textColor, dmgPerTurn){
        let displayText = dmgPerTurn ? `-${dmgPerTurn}\ntext` : text;

        const debuffText = scene.add.text(x, y, displayText, {fontSize: uiStats.dmgPopupFontsize, color: textColor}).setOrigin(0.5);
        scene.tweens.add({
            targets: debuffText,
            y: '-=100',
            alpha: 0,
            duration: 800,
            onComplete: () => debuffText.destroy()
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
            //Debuff.showDebuffPopup(scene, target.x, target.y, this.text, this.textColor, this.dmgPerTurn);
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