import { Explosion, VoidSurge } from "./reactions.js";
import { Debuff } from "./debuffs.js";
import { dmgTarget } from "./combat.js";
import { gameState } from "./gameState.js";

export class Effect{
    constructor(dmg, element=null, debuff=null, text, textColor= '#ED0000'){
        // this.id = id;
        this.dmg = dmg;
        this.element = element;
        this.debuff = debuff;
        this.text = text;
        this.textColor = textColor;

        this.preventElementalDebuff = false;  // if element triggered reaction => don't apply base debuff (e.g., Burn, Shock, Wet)
    }

    // Override for custom reactions:
    applyReactions(scene, source, target, queue, key){  // include source for more custom logic (maybe passives)
        const debuffs = target.getData('debuffs') || [];
        const newDebuffs = debuffs.filter(debuff => {
            if (this.element === 'Water' && debuff.element === 'Fire') return this.cleanseDebuff();
            if (this.element === 'Fire' && debuff.element === 'Electro'){
                queue.push(createExplosion(100, target));  // push to queue, fixed dmg for now
                return this.cleanseDebuff();
            }
            if (this.element === 'Fire' && debuff.element === 'Water'){
                this.dmg*=0.5;
                return this.cleanseDebuff();
            }
            if (this.element === 'Dark' && debuff.element === 'Light'){
                queue.push(createVoidSurge(this.dmg*10, target));  // push to queue
                return this.cleanseDebuff();
            }
            return true;
        })
        target.setData('debuffs', newDebuffs);
        const textOnly = this.dmg === 0;  // effect has no base dmg => only display text

        gameState.logQueue[key]['targets'].push(target);
        gameState.logQueue[key]['dmg'].push(this.dmg);

        return dmgTarget(scene, this.dmg, source, target, textOnly ? this.debuff.name : this.text, this.textColor, textOnly);
    }

    // Applies debuff to target if set and allowed.
    applyDebuff(source, target){
        if (this.debuff && target.getData('hp') > 0){  // debuff set AND target lives
            if (this.debuff.type !== 'elemental' || !this.preventElementalDebuff){  // always place non-elemental debuffs or if no reactions were triggered
                const debuffs = target.getData('debuffs') || [];
                if (debuffs.length < 5 && Debuff.allowDebuff(debuffs, this.debuff.name)){  // max 5 debuffs AND prevent duplicates unless allowed
                    debuffs.push(this.debuff.createCopy(source));
                    target.setData('debuffs', debuffs);
                    return 1;  // maybe more than one in the future
                }
            }
        }
        this.preventElementalDebuff = false;  // reset for next reaction
        return 0;
    }

    // Sets flag and returns false.
    cleanseDebuff(){
        this.preventElementalDebuff = true;
        return false;
    }
}

// Creates an Explosion to push to Reaction queue.
function createExplosion(dmg, target){
    const effect = createReactionEffect(dmg, null, 'Explosion', '#ed6b00');  // element = null => no insane cascading
    const reaction = new Explosion(effect);
    return getQueueEntry(reaction, target);
}
// Creates a VoidSurge to push to Reaction queue.
function createVoidSurge(dmg, target){
    const effect = createReactionEffect(dmg, null, 'Void Surge', '#b700ff');
    const reaction = new VoidSurge(effect);
    return getQueueEntry(reaction, target);
}

// Creates a custom effect for a Reaction, i.e., no element.
function createReactionEffect(dmg, debuff, text, textColor){
    return new Effect(dmg, null, debuff, text, textColor);
}

// Builds and returns an entry for the reaction queue.
function getQueueEntry(reaction, target){
    const affectedTargets = reaction.getAffectedTargets(target.getData('team'), target.getData('teamIndex'));
    return {targets: affectedTargets, reaction: reaction};
}