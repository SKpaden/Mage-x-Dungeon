import { Explosion } from "./reactions.js";
import { Debuff } from "./debuffs.js";
import { dmgTarget } from "./combat.js";

export class Effect{
    constructor(name, dmg, targets='single', element=null, debuff=null){
        this.name = name;
        this.dmg = dmg;
        this.targets = targets;
        this.element = element;
        this.debuff = debuff;
    }

    // Override for custom reactions:
    applyReactions(target){
        const debuffs = target.getData('debuffs') || [];
        const newDebuffs = debuffs.filter(debuff => {
            if (this.element === 'water' && debuff.name === 'Burn') return false;
            if (this.element === 'fire' && debuff.name === 'Shock'){
                this.dmg+= 50;
                // getReactionEffect(dmg, (debuff))  // element = null => no insane cascading
                return false;
            }
            if (this.element === 'fire' && debuff.name === 'Wet'){
                this.dmg*=0.5;
                return false;
            }
            return true;
        })
        target.setData('debuffs', newDebuffs);
    }

    // Applies debuffs if set.
    applyDebuff(target){
        if (this.debuff){  // change to debuff bluebrint and build new debuff!!! otherwise the duration is shared for AoE skills...
            const debuffs = target.getData('debuffs') || [];
            debuffs.push(this.debuff);
            target.setData('debuffs', debuffs);
        }
    }

    // Gets affectedTargets
    getAffectedTargets(team, index){
        
    }
}

export class Effect2{
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
    applyReactions(scene, source, target, queue){  // include source for more custom logic (maybe passives)
        const debuffs = target.getData('debuffs') || [];
        const newDebuffs = debuffs.filter(debuff => {
            if (this.element === 'water' && debuff.name === 'Burn') return this.cleanseDebuff();
            if (this.element === 'fire' && debuff.name === 'Shock'){
                //this.dmg+= 50;
                const effect = getReactionEffect(100, null, 'Explosion', '#ed6b00');  // element = null => no insane cascading
                const reaction = new Explosion(effect);
                const affectedTargets = reaction.getAffectedTargets(target.getData('team'), target.getData('teamIndex'));
                queue.push({targets: affectedTargets, effect: reaction.effect});  // push to queue
                return this.cleanseDebuff();
            }
            if (this.element === 'fire' && debuff.name === 'Wet'){
                this.dmg*=0.5;
                return this.cleanseDebuff();
            }
            return true;
        })
        target.setData('debuffs', newDebuffs);
        
        dmgTarget(scene, this.dmg, source, target, this.text, this.textColor);
    }

    // Applies debuff to target if set and allowed.
    applyDebuff(source, target){
        if (this.debuff && target.getData('hp') > 0){  // debuff set
            if (this.debuff.type !== 'elemental' || !this.preventElementalDebuff){  // always place non-elemental debuffs or if no reactions were triggered
                const debuffs = target.getData('debuffs') || [];
                if (debuffs.length < 5 && Debuff.allowDebuff(debuffs, this.debuff.name)){  // max 5 debuffs AND prevent duplicates unless allowed
                    debuffs.push(this.debuff.createCopy());
                    target.setData('debuffs', debuffs);
                }
            }
        }
        this.preventElementalDebuff = false;  // reset for next reaction
    }

    // Sets flag and returns false.
    cleanseDebuff(){
        this.preventElementalDebuff = true;
        return false;
    }
}

// Creates a custom effect for a Reaction, i.e., no element.
function getReactionEffect(dmg, debuff, text, textColor){
    return new Effect2(dmg, null, debuff, text, textColor);
}