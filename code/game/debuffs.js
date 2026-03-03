import { playDebuffPopup } from "../ui/combatTweens.js";
import { showNegativePopup, showPositivePopup } from "../ui/popups.js";
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

    // Lookup for default elemental debuffs.
    static defaultElementalDebuffs = {
        'Dark': new Debuff("Scared", 1, 0, null, null, true, "cc", null),
        'Electro': new Debuff('Shock', 2, 10, 'Electro', null, false, 'elemental', null),
        'Fire': new Debuff('Burn', 3, 20, 'Fire', null, false, 'elemental', null),
        'Light': new Debuff('Blinded', 3, 0, 'Light', null, false, 'elemental', null),
        'Poison': new Debuff('Poison', 2, 50, 'Poison', null, false, 'elemental', null),
        'Water': new Debuff('Wet', 3, 0, 'Water', null, false, 'elemental', null),

        // more
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

    // Returns an instance of the default elemental debuff based on the element.
    static getDefaultElementalDebuff(element){
        const debuff = Debuff.defaultElementalDebuffs[element];
        return debuff;
    }

    /////////////////////////////////////////////////////////////////// NON-STATIC ///////////////////////////////////////////////////////////////////

    // Applies debuff to target if allowed. Supposed to replace old apply.
    applyDebuff(scene, source, target, showPopup = true){
        const allowed = target.getData('char').triggerEvent('onApplyDebuff', this, source);  // trigger event and see if debuff is allowed
        if (!allowed){
            if (!showPopup){  // delay to not overlap with dmg numbers
                scene.time.delayedCall(300, () => showPositivePopup(scene, target.x, target.y, "Immune"));
            } else{  // normal debuff application
                showPositivePopup(scene, target.x, target.y, "Immune");
            }
            return 0;
        }

        if (target.getData('hp') > 0){  // debuff set AND target lives
            const debuffs = target.getData('debuffs') || [];
            if (debuffs.length < 5 && Debuff.allowDebuff(debuffs, this.name)){  // max 5 debuffs AND prevent duplicates unless allowed
                debuffs.push(this.createCopy(source));
                target.setData('debuffs', debuffs);
                if (showPopup) playDebuffPopup(scene, target.x, target.y, this.name, uiStats.negativePopupOptions);
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

// Class for debuffs that affect stats of a character.
export class StatAffectingDebuff extends Debuff{
    constructor(name, duration, affects, value, source = null){  // { absolute: 50, percentage: 0.2 }
        super(name, duration, 0, null, null, false, "normal", source);
        this.affects = affects;
        this.value = value;
    }

    // Try to apply debuff.
    applyDebuff(scene, source, target){
        const allowed = target.triggerEvent('onApplyDebuff', this, source);
        if (!allowed){
            showPositivePopup(scene, target.x, target.y, "Immune");
            return 0;  // trigger event and see if debuff is allowed
        }

        if (target.getData('hp') > 0){  // debuff set AND target lives
            const debuffs = target.getData('debuffs') || [];
            if (debuffs.length < 5 && Debuff.allowDebuff(debuffs, this.name)){  // max 5 debuffs AND prevent duplicates unless allowed
                debuffs.push(this.createCopy(source));
                target.setData('debuffs', debuffs);
                playDebuffPopup(scene, target.x, target.y, this.name, uiStats.negativePopupOptions);
                this.onApply(scene, target);
                return 1;  // maybe more than one in the future
            }
        }
        return 0;  // only really useful with resists and passives (immune to stun)
    }

    // Create copy of this class, only set source.
    createCopy(source){
        return new StatAffectingDebuff(this.name, this.duration, this.affects, this.value, source);
    }

    // Whenever Debuff gets applied => decreases current stats.
    onApply(scene, target){
        const char = target.getData('char');
        const statManager = char.statManager;
        let current = statManager.getCurrentStat(this.affects);

        if (this.value.percentage){  // percentage-based reduction
            const base = statManager.getBaseStat(this.affects);
            current = Math.max(1, current - Math.floor(this.value.percentage*base));
        } else {  // absolute
            current = Math.max(1, current - this.value.absolute);
        }
        statManager.setCurrentStat(this.affects, current);
    }

    // Whenever Debuff gets applied => reverts decrease of current stats.
    onRemove(scene, target){
        const char = target.getData('char');
        const statManager = char.statManager;
        let current = statManager.getCurrentStat(this.affects);

        if (this.value.percentage){
            const base = statManager.getBaseStat(this.affects);
            current = Math.max(1, current + Math.floor(this.value.percentage*base));
        } else {
            current = Math.max(1, current + this.value.absolute);
        }
        statManager.setCurrentStat(this.affects, current);
    }

    // Activates debuff's effect/dmg on target.
    tick(scene, target){
        this.duration-=1;
        const keepDebuff = this.duration > 0;
        if (!keepDebuff) this.onRemove(scene, target);
        return keepDebuff;
    }
}