import { playDebuffPopup } from "../ui/combatTweens.js";
import { updateHP } from "../ui/portraitFactory.js";
import { uiStats } from "../ui/uiStats.js";

export class Debuff{
    constructor(name, duration, dmgPerTurn = 0, element = null, triggerEffect = null, skipTurn = false, type = "elemental", appliedBy = null){
        this.name = name;
        this.duration = duration;
        this.dmgPerTurn = dmgPerTurn;
        this.element = element;  // for reactions
        this.triggerEffect = triggerEffect;  // probably remove this...don't know if this makes sense and I'm not using it anyway
        this.skipTurn = skipTurn;
        this.type = type;  // elemental/cc/normal

        // That's good for passives, I think:
        this.appliedBy = appliedBy;

        // For later display:
        this.description = "No description!";
        this.icon = null;  // TODO
        this.description = "Debuff Description";
        this.textColor = '#ED0000';
    }   

    // Debuffs that can be applied mutliple times to one enemy:
    static stackingDebuffs = ['Poison'];

    static reactionLookup = {
        'Fire': {
            'Electro': 'Explosion',
            'Water': 'Steam',
            // ...
        },
        'Electro': {
            'Fire': 'Explosion',
            'Water': 'Overload',
            // ...
        },
        'Dark': {
            'Light': 'VoidSurge',
            // ...
        },
        // ...
    }

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
        return Debuff.reactionLookup[element][debuff.element];  // maybe as lookup arrays [debuff.name] ==> also for multipliers/dmg
    }

    /////////////////////////////////////////////////////////////////// NON-STATIC ///////////////////////////////////////////////////////////////////

    // Applies debuff to target if allowed. Supposed to replace old apply.
    applyDebuff(scene, source, target){
        if (target.getData('hp') > 0){  // debuff set AND target lives
            const debuffs = target.getData('debuffs') || [];
            if (debuffs.length < 5 && Debuff.allowDebuff(debuffs, this.name)){  // max 5 debuffs AND prevent duplicates unless allowed
                debuffs.push(this.createCopy(source));
                target.setData('debuffs', debuffs);
                playDebuffPopup(scene, target.x, target.y, this.name, uiStats.negativePopupOptions);
                return 1;  // maybe more than one in the future
            }
        }
        return 0;  // only really useful with resists and passives (immune to stun)
    }

    // Return a new instance of Debuff with the exact same stats, only source gets set.
    createCopy(source){
        return new Debuff(this.name, this.duration, this.dmgPerTurn, this.element, this.triggerEffect, this.skipTurn, this.type, source);
    }

    // Shows debuff popup.
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

    // Check if this debuff prevents a turn.
    skip(){
        return this.skipTurn;
    }

    // Activates debuff's effect/dmg on target.
    tick(scene, target){
        if(this.dmgPerTurn > 0){
            const currentHp = target.getData('hp');
            const newHp = Math.max(0, currentHp - this.dmgPerTurn);
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