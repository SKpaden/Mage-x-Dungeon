import { SkillContext } from "../data/skillContext.js";
import { StatManager } from "../data/statManager.js";
import { setLogTarget } from "../ui/combatLog.js";
import { playDebuffPopup } from "../ui/combatTweens.js";
import { showNegativePopup, showPositivePopup } from "../ui/popups.js";
import { updateHP } from "../ui/portraitFactory.js";
import { uiStats } from "../ui/uiStats.js";

export class Debuff{
    /**
     * Generic debuff.
     * dmgPerTurn can be:
     *  - number (absolute)
     *  - { type: 'absolute'|'percent', amount: number, basis?: 'max'|'current' }
     *
     * Supports both named option objects and legacy positional args.
     */
    static normalizeOptions(args){
        if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null){
            return { ...args[0] };
        }
        const [name, duration, dmgPerTurn = 0, element = null, triggerEffect = null, skipTurn = false, type = "elemental", appliedBy = null] = args;
        return { name, duration, dmgPerTurn, element, triggerEffect, skipTurn, type, appliedBy };
    }

    constructor(...args){
        const {
            name,
            duration,
            dmgPerTurn = 0,
            element = null,
            triggerEffect = null,
            skipTurn = false,
            type = "elemental",
            appliedBy = null,
            description = "Debuff Description",
            icon = null,
            textColor = '#ED0000',
            maxStacks = 1,
            stackable = false,
            onApply = null,
            onTick = null,
            onRemove = null
        } = Debuff.normalizeOptions(args);

        this.name = name;
        this.duration = duration;
        this.dmgPerTurn = dmgPerTurn;
        this.element = element;  // for reactions
        this.triggerEffect = triggerEffect;  // optional callback or effect object
        this.skipTurn = skipTurn;
        this.type = type;  // elemental/cc/normal
        this.appliedBy = appliedBy;
        this.description = description;
        // Optional/not used yet:
        this.icon = icon;
        this.textColor = textColor;
        this.maxStacks = maxStacks;
        this.stackable = stackable;
        this.onApply = onApply;
        this.onTick = onTick;
        this.onRemove = onRemove;
    }

    // Lookup for default elemental debuffs.
    static defaultElementalDebuffs = {
        'Dark': new Debuff("Scared", 1, 0, null, null, true, "cc", null),
        'Blood': new Debuff("Bleed", 3, 50, 'Blood', null, false, "elemental", null),
        'Electro': new Debuff('Shock', 2, 10, 'Electro', null, false, 'elemental', null),
        'Fire': new Debuff('Burn', 3, 20, 'Fire', null, false, 'elemental', null),
        'Light': new Debuff('Blinded', 3, 0, 'Light', null, false, 'elemental', null),
        'Poison': new Debuff('Poison', 2, {type: 'percent', amount: 0.05}, 'Poison', null, false, 'elemental', null),
        'Water': new Debuff('Wet', 3, 0, 'Water', null, false, 'elemental', null),

        // more
    }

    // Debuffs that can be applied mutliple times to one enemy:
    static stackingDebuffs = ['Poison'];

    /**
     * Checks if a Debuff is allowed to be added to a Debuff list.
     * @param {Array.<Debuff>} debuffs The list of Debuffs
     * @param {String} name The name of the Debuff to check
     * @returns {boolean} Whether the Debuff is allowed to be added to the list or not
     */
    static allowDebuff(debuffs, name){
        if (debuffs.length === 5) return false;
        const contains = Debuff.containsDebuff(debuffs, name);
        if(contains && Debuff.stackingDebuffs.includes(name)  || !contains){  // present AND stacking OR not present
            return true;
        }
        return false;
    }

    /**
     * Checks whether a Debuff list contains a Debuff with the name.
     * @param {Array.<Debuff>} debuffs The list of Debuffs to check
     * @param {String} name The name of the Debuff to check for
     * @returns {boolean} Whether the Debuff list contains the Debuff with the name
     */
    static containsDebuff(debuffs, name){
        var contains = false;
        debuffs.forEach(debuff => {
            if (debuff.name === name) contains = true;
        });
        return contains;
    }

    /**
     * Gets the default elemental Debuff for an element.
     * @param {String} element The element to get the default Debuff for
     * @returns {Debuff} The default elemental Debuff
     */
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

    /**
     * Creates and returns a new instance of the same Debuff class with the same stats, only source gets set.
     * @param {Object} source The Phaser container game object
     * @returns {Debuff} The deep copy of the Debuff with the source field set
     */
    createCopy(source){
        const copy = Object.create(Object.getPrototypeOf(this));
        Object.assign(copy, this);
        copy.appliedBy = source;
        return copy;
    }

    /**
     * Gets the tick damage of this Debuff for the target.
     * @param {Object} target The target Phaser container object of the Debuff tick
     * @returns {int} The amount of tick damage for the current target
     */
    getTickDmg(target){
        let dmg = 0;
        if (typeof this.dmgPerTurn === 'number'){
            dmg = this.dmgPerTurn;
        } else if (this.dmgPerTurn && this.dmgPerTurn.type === 'absolute'){
            dmg = this.dmgPerTurn.amount;
        } else if (this.dmgPerTurn && this.dmgPerTurn.type === 'percent'){
            const basis = this.dmgPerTurn.basis || 'max';
            const hpBase = StatManager.getContainerStat(target, 'hp', basis !== 'max');
            dmg = Math.floor(hpBase * this.dmgPerTurn.amount);
        }
        return dmg;
    }

    /**
     * Check whether this Debuff skips a Character's turn.
     * @returns {boolean} Whether this Debuff causes to skip a turn
     */
    skip(){
        return this.skipTurn;
    }

    // Activates debuff's effect/dmg on target.
    tick(scene, target, ctx = {}){
        const dmg = this.getTickDmg(target);        

        if (this.triggerEffect) {
            if (typeof this.triggerEffect === 'function') this.triggerEffect(scene, target, ctx);
            else if (this.triggerEffect.applyTo) this.triggerEffect.applyTo(target, ctx);
        }

        this.duration-=1;
        return { keep: this.duration > 0, baseTickDmg: dmg, debuff: this, skipTurn: this.skipTurn };
    }
}

// Class for debuffs that affect stats of a character.
export class StatAffectingDebuff extends Debuff{
    constructor(...args){
        const opts = typeof args[0] === 'object' && args[0] !== null ? args[0] : null;
        if (opts){
            super({ ...opts, type: 'normal', dmgPerTurn: 0 });
            this.affects = opts.affects;
            this.value = opts.value;
        } else {
            const [name, duration, affects, value, source = null] = args;
            super({ name, duration, dmgPerTurn: 0, element: null, triggerEffect: null, skipTurn: false, type: 'normal', appliedBy: source });
            this.affects = affects;
            this.value = value;
        }
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

    // Whenever Debuff gets removed => reverts decrease of current stats.
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
        return { keep: keepDebuff, baseTickDmg: 0, debuff: this, skipTurn: this.skipTurn };
    }
}

// Control debuff example: forces unit to attack a random ally and then skip its turn.
export class ControlDebuff extends Debuff{
    constructor(...args){
        const opts = typeof args[0] === 'object' && args[0] !== null ? args[0] : null;
        if (opts){
            super({ ...opts, type: 'cc', skipTurn: true });
            this.textColor = opts.textColor || '#ff00b3';
        } else {
            const [name, duration, type = 'cc', appliedBy = null] = args;
            super({ name, duration, dmgPerTurn: 0, element: null, triggerEffect: null, skipTurn: true, type, appliedBy });
            this.textColor = '#ff00b3';
        }
    }

    /**
     * Ticks the Debuff (duration--) and returns object with important info for pipeline processing.
     * @param {Object} scene The current Phaser Scene object
     * @param {Object} target The Debuff target Phaser container game object
     * @param {SkillContext} ctx The context of the pipeline
     * @returns {Object} Flags and stats about this Debuff tick
     */
    async tick(scene, target, ctx = {}){
        // On tick, force the unit to attack a random ally:
        const engine = ctx.scene.combatEngine;
        let chosen = null;

        const allies = ctx.allies;
        // Choose a random ally (excluding self) that is alive:
        const candidates = allies.filter(c => c !== target && c.getData('hp') > 0);
        if (candidates.length > 0){
            const rand = Math.floor(Math.random() * candidates.length);
            chosen = candidates[rand];
        }

        this.duration-=1;
        return { keep: this.duration > 0, baseTickDmg: 0, debuff: this, skipTurn: this.skipTurn, chosenTarget: chosen };
    }
}