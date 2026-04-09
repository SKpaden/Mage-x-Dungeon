import { dmgTarget, getAffectedTargets } from "./combat.js";
import { gameState } from "./gameState.js";
import { getDefaultElementColor } from "../ui/elementColors.js";
import { delay } from "../ui/helpers.js";
import { updateDebuffDisplay } from "../ui/portraitFactory.js";
import { uiStats } from "../ui/uiStats.js";

export class Reaction{
    constructor(name, area, dmg, debuff = null, color = '#ED0000'){
        this.name = name;
        this.area = area;

        this.dmg = dmg;
        this.debuff = debuff;
        this.color = color;
    }

    // Lookup for Reactions based on first and second element:
    static reactionLookup = {
        'Dark': {
            'Light': (dmg) => new Reaction('Void Surge', 'all', dmg, null, getReactionColor('Void Surge')),
            // ...
        },
        'Electro': {
            'Fire': (dmg) => new Reaction('Explosion', 'adjacent', dmg, null, getReactionColor('Explosion')),
            'Water': (dmg) => new Reaction('Overload', 'adjacent', dmg, null, getReactionColor('Overload')),
            // ...
        },
        'Fire': {
            'Electro': (dmg) => new Reaction('Explosion', 'adjacent', dmg, null, getReactionColor('Explosion')),
            'Water': (dmg) => new Reaction('Steam', 'single', dmg, null, getReactionColor('Steam')),
            // ...
        },
        'Light': {
            'Dark': (dmg) => new Reaction('Void Surge', 'adjacent', dmg, null, getReactionColor('Void Surge')),
            // ...
        },
        'Water': {
            'Electro': (dmg) => new Reaction('Overload', 'adjacent', dmg, null, getReactionColor('Overload')),
            'Fire': (dmg) => new Reaction('Steam', 'single', dmg, null, getReactionColor('Steam')),
            // ...
        }
        // ...
    }

    // Returns an object to add to the Reaction queue in gameState.
    static getQueueEntry(reaction, target, team){
        const affectedTargets = getAffectedTargets(reaction.area, target.getData('teamIndex'), team);
        return {targets: affectedTargets, reaction: reaction};
    }

    // Returns reaction of debuff with element or null.
    static getTriggeredReaction(debuff, element, dmg){
        const elementCreators = Reaction.reactionLookup[element];
        if (elementCreators) {
            const creator = Reaction.reactionLookup[element][debuff.element];
            if (creator) return creator(dmg);
        }
        return null;
    }
    
    // Triggers Reactions on a target.
    static async triggerReactions(scene, source, target, allies, enemies, key, element, dmg){
        const char = target.getData('char');
        const debuffs = target.getData('debuffs');
        let allowElementalDebuff = true;
        const finalDmg = dmg;

        // Look at all debuffs if any:
        if (debuffs.length > 0){
            const debuffFilter = {};  // what debuffs get removed by Reactions?
            for (let i = 0; i < debuffs.length; i++) {
                const debuff = debuffs[i];
                if (debuff.type === 'elemental') {  // only elemental debuffs can trigger Reactions
                    // Use these stats maybe to tweak dmg of Reaction:
                    const duration = debuff.duration;
                    const finalDmg = dmg*duration;
                    
                    const triggeredReaction = Reaction.getTriggeredReaction(debuff, element, finalDmg, );
                    if (triggeredReaction) {
                        debuffFilter[debuff.name] = false;
                        allowElementalDebuff = false;  // element triggered Reaction ==> don't place default elemental debuff
                        gameState.reactionQueue.push(Reaction.getQueueEntry(triggeredReaction, target, enemies));
                        gameState.logQueue[key].reactionsTriggered++;
                    } else {
                        debuffFilter[debuff.name] = true;
                    }
                }
            }
            // Update debuffs:
            const newDebuffs = debuffs.filter((debuff) => debuffFilter[debuff.name]);
            target.setData('debuffs', newDebuffs);
            updateDebuffDisplay(scene, target);
        }


        // Add to logQueue:
        if (!gameState.logQueue[key]['targets'].includes(target)) gameState.logQueue[key]['targets'].push(target);
        gameState.logQueue[key]['dmg'].push(finalDmg);
        
        const dealtDmg = dmgTarget(scene, finalDmg, source, target, element, getDefaultElementColor(element), false);  // replace color by getDefaultColor(element)
        return {allowElementalDebuff: allowElementalDebuff, dealtDmg: dealtDmg};
    }

    // Processes all queued elemental Reactions.
    static async processReactionQueue(scene, source, allies, enemies, index = 0){
        // All reactions triggered:
        if (index >= gameState.reactionQueue.length){
            return;
        }
        else {  // still reactions left...
            await delay(scene, uiStats.reactionDelay);  // artificial delay
            const reactionEntry = gameState.reactionQueue[index];
            const targets = reactionEntry.targets;
            const reaction = reactionEntry.reaction;
            if (reaction.processReaction(scene, targets, source, allies, enemies)) scene.cameras.main.shake(200, 0.01);  // shake screen after every reaction
    
            return Reaction.processReactionQueue(scene, source, allies, enemies, index + 1);
        }
    }

    /////////////////////////////////////////////////////////////////// NON-STATIC ///////////////////////////////////////////////////////////////////

    // Activates a Reaction on a single target.
    activate(scene, source, target){
        if (!gameState.logQueue[this.name]['targets'].includes(target)) gameState.logQueue[this.name]['targets'].push(target);
        gameState.logQueue[this.name]['dmg'].push(this.dmg);

        return dmgTarget(scene, this.dmg, source, target, this.name, this.color, false);
    }
    
    // Triggers a Reaction to all targets.
    processReaction(scene, targets, source, allies, enemies){
        if (!gameState.logQueue[this.name]) gameState.logQueue[this.name] = { 'targets': [], 'dmg': []};  // add reaction to log queue
        let dealtDmg = false;
        let updated = false;
            targets.forEach(i => {
                dealtDmg = this.activate(scene, source, enemies[i]);
                if (dealtDmg) updated = true;
            });
        return updated;
    }
}

// Colors for Reactions:
const reactionColors = {
    'Explosion': '#ED0000',
    'Overload': '#1100ff',
    'Steam': '#6e7991',
    'Void Surge': '#b525f8',
}
// Returns the Reaction color by name.
function getReactionColor(name){
    return reactionColors[name];
}