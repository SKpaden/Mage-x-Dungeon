import { getAttackOrder } from "./helpers.js";
import { dmgTarget, getAffectedTargets } from "../game/combat.js";
import { Debuff } from "../game/debuffs.js";
import { gameState } from "../game/gameState.js";
import { Reaction } from "../game/reactions.js";
import { boostTurnMeter } from "../game/turnMeterManager.js";
import { getLogTarget } from "../ui/combatLog.js";
import { playPhysicalAttackTween } from "../ui/combatTweens.js";
import { delay } from "../ui/helpers.js";
import { showNegativePopup, showPositivePopup } from "../ui/popups.js";
import { updateDebuffDisplay } from "../ui/portraitFactory.js";
import { uiStats } from "../ui/uiStats.js";

// Class to extend from. SkillParts are reusable actions inside a skill (e.g., decrease CD).
class SkillPart{
    constructor(params = {}){
        this.params = params;
    }

    /**
     * Executes a specific part of a Skill.
     * @param {Object} scene    Phaser scene object
     * @param {Object} source   Phaser container of the character performing the action
     * @param {Object} target   Phaser container of the character targeted by the source
     * @param {int} index       Index of the target container within its team
     * @param {Array} allies    Array of allied character containers of the source
     * @param {Array} enemies   Array of enemy character containers of the source
     */
    execute(scene, source, target, index, allies, enemies){}
}

// Activates all poison stacks on targets, more poisons = more damage.
/**
 * Params: { area: 'all'/'adjacent'/'single' }
 */
export class ActivatePoison extends SkillPart{
    async execute(scene, source, target, index, allies, enemies){
        const { area = 'all'} = this.params;
        const affectedTargets = getAffectedTargets(area, index, enemies);
        for (let i = 0; i < affectedTargets.length; i++){
            const unitIndex = affectedTargets[i];
            const container = enemies[unitIndex];
            const debuffs = container.getData('debuffs');
            // Count poisons:
            let poisonCount = 0;
            let dmgCount = 0;
            debuffs.forEach(debuff => {
                if (debuff.name === 'Poison'){
                    poisonCount += debuff.duration;
                    dmgCount += debuff.dmgPerTurn;
                }
            });
            // Remove poisons:
            const newDebuffs = debuffs.filter((debuff) => {
                if (debuff.name === 'Poison') return false;
                return true;
            });
            container.setData('debuffs', newDebuffs);
            // Visuals + dmg:
            updateDebuffDisplay(scene, container);
            dmgTarget(scene, poisonCount*dmgCount, source, container, 'Poison x'+poisonCount, '#007700');
        }
    }
}

// Ally attack: Allies attack target with default skill.
/**
 * Params: { amount: 'all'/1,2,3,4,5 }
 */
export class AllyAttack extends SkillPart{  // works overall, but logQueue is not processed correctly => logQueue rework needed
    async execute(scene, source, target, index, allies, enemies){
        const { amount = 'all'} = this.params;
        let maxAmount = amount === 'all' ? allies.length : amount;
        let hasAttacked = 0;
        const shuffledIndexes = getAttackOrder(source.getData('teamIndex'), allies.length);
        for (let i = 0; i < shuffledIndexes.length; i++) {
            const attackerIndex = shuffledIndexes[i];
            const ally = allies[attackerIndex];
            const char = ally.getData('char')  // get char class to access skills
            const allyHp = ally.getData('hp');
            if (allyHp > 0){
                const allySkill = char.skills[0];
                await allySkill.apply(scene, ally, target, index, allies, enemies);
                await delay(scene, uiStats.debuffDelay / 2);
                hasAttacked++;
                if (hasAttacked === maxAmount) break;
            }
        }
    }
}

// Applying debuffs.
/**
 * Params: { area: 'all'/'adjacent'/'single', debuff: new Debuff(...), targets: 'enemies'/'allies'}
 */
export class ApplyDebuff extends SkillPart{
    async execute(scene, source, target, index, allies, enemies){
        const { area = 'single', debuff, targets = 'enemies'} = this.params;
        const targetedTeam = targets === 'enemies' ? enemies : allies;
        // works for 2 Actions: first enemies, then allies, but I need to be careful when targeting one team and applying debuffs to both teams
        // ==> getAffectecTargets() not quite correct for both teams.
        // But: It makes no sense to target enemies with 'adjacent' and also have adjacent on ally team, so it's fine I think.
        let affectedTargets = getAffectedTargets(area, index, targetedTeam);
        
        affectedTargets.forEach(i => {
            const unit = targetedTeam[i];
            debuff.applyDebuff(scene, source, unit);  // add to debuff application count here
            updateDebuffDisplay(scene, unit);
        })
    }
}

// Boost turn meter.
/**
 * Params: { area: 'all'/'adjacent'/'single', amount: %}
 */
export class BoostTurnMeter extends SkillPart{
    async execute(scene, source, target, index, allies, enemies){
        const { area = 'single', amount} = this.params;
        let affectedTargets = getAffectedTargets(area, index, allies);
        affectedTargets.forEach(i => {
            const unit = allies[i];
            boostTurnMeter(scene, unit, amount);
            showPositivePopup(scene, unit.x, unit.y, 'Boost\nTurn Meter');
        });
    }
}

// Dealing damage part of a skill (old effect).
/**
 * Params: { area: 'all'/'single', dmg: int, element: 'Phyisical'/'Fire', skillName: 'Fireball}
 */
export class DealDamage extends SkillPart{
    async execute(scene, source, target, index, allies, enemies){
        const { area = 'single', dmg, element = 'Physical', skillName} = this.params;
        const affectedTargets = getAffectedTargets(area, index, enemies);
    
        playPhysicalAttackTween(scene, source, target.x, target.y);  // only play when dmg, but fine for now

        // Should a debuff be applied from an elemental Skill?
        let debuff = null;
        if (element !== 'Physical'){
            debuff = Debuff.getDefaultElementalDebuff(element);
        }

        let debuffsApplied = 0;

        // Go through all targets:
        for (let i = 0; i < affectedTargets.length; i++){
            const targetIndex = affectedTargets[i];
            const currentTarget = enemies[targetIndex];
            const char = currentTarget.getData('char');
            //const finalDmg = char.triggerEvent('onDealDamage', scene, source, dmg, element);

            const allowDebuff = (await Reaction.triggerReactions(scene, source, currentTarget, allies, enemies, getLogTarget(), element, dmg)).allowElementalDebuff;
            // Apply debuff:
            if (debuff && allowDebuff){
                debuffsApplied += debuff.applyDebuff(scene, source, currentTarget, false);
                updateDebuffDisplay(scene, currentTarget);
            }
        }
        gameState.logQueue[getLogTarget()].debuffsApplied += debuffsApplied;
        await Reaction.processReactionQueue(scene, source, allies, enemies);  // process Reactions in gameState queue
    }
}

// Increases CDs on enemy team.
/**
 * Params: { area: 'all'/'single'}
 */
export class IncreaseCD extends SkillPart{
    execute(scene, source, target, index, allies, enemies){
        const { area = 'all'} = this.params;
        const affectedTargets = getAffectedTargets(area, index, enemies);
        affectedTargets.forEach(containerIndex => {
            const container = enemies[containerIndex];
            const char = container.getData('char');
            const charHp = container.getData('hp');
            if (charHp > 0 && char.lockout()) showNegativePopup(scene, container.x, container.y, "Increase\nCooldown");  // maybe pass source as arg to factor in passives
        });
    }
}
// Increases CDs on enemy team.
/**
 * Params: { area: 'all'/'adjacent'/'single', includedDebuffs: ['Burn', 'Poison']}
 */
export class IncreaseDebuffDuration extends SkillPart{
    execute(scene, source, target, index, allies, enemies){
        const { area = 'all', includeDebuffs = 'all', amount = 1} = this.params;
        const affectedTargets = getAffectedTargets(area, index, enemies);
        for (let i = 0; i < affectedTargets.length; i++){
            const unitIndex = affectedTargets[i];
            let incCount = 0;
            const container = enemies[unitIndex];
            const debuffs = container.getData('debuffs');
            debuffs.forEach(debuff => {
                // Exclude cc debuffs:
                if (debuff.type !== 'cc'){
                    debuff.duration += amount;
                    incCount++;
                }
            })
            if (incCount) showNegativePopup(scene, container.x, container.y, "Increase Debuff\nDuration x" + incCount);
            updateDebuffDisplay(scene, container);
        }
    }
}
// Resets the CDs on one or more team members.
/**
 * Params: { area: 'all'/'single'}
 */
export class ResetCD extends SkillPart{
    execute(scene, source, target, index, allies, enemies){
        const { area = 'all'} = this.params;
        switch (area){
            case 'all':
                allies.forEach(container => {
                    const char = container.getData('char');
                    const charHp = container.getData('hp');
                    if (charHp > 0 && char.resetCDs()) showPositivePopup(scene, container.x, container.y, "Decrease\nCooldown");  // maybe pass source as arg to factor in passives
                });
                break;
            case 'single':
                if (target.getData('char').resetCDs()) showPositivePopup(scene, target.x, target.y, "Decrease\nCooldown");
                break;
        }
    }
}
// Removes all debuffs from one or more team members.
/**
 * Params: { area: 'all'/'single'}
 */
export class FullCleanse extends SkillPart{
    execute(scene, source, target, index, allies, enemies){
        const { area = 'all' } = this.params;
        switch (area){
            case 'all':
                allies.forEach((ally) => {
                    ally.setData('debuffs', []);
                    const charHp = ally.getData('hp');
                    if (charHp > 0){
                        updateDebuffDisplay(scene, ally);
                        showPositivePopup(scene, ally.x, ally.y, "Cleanse");
                    }
                })
                break;
            case 'single':
                target.setData('debuffs', []);
                updateDebuffDisplay(scene, target);
                showPositivePopup(scene, target.x, target.y, "Cleanse");
                break;

        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CREATE SkillParts FROM TEMPLATES:

// Creates an action (SkillPart) from a template.
export function createActionFromTemplate(data){
    const params = data.params;
    const className = data.className;
    return skillPartFactories[className](params);
}

// To dynamically create SkillPart subclasses based on skill template:
const skillPartFactories = {
    ActivatePoison: (params) => new ActivatePoison(params),
    AllyAttack: (params) => new AllyAttack(params),
    ApplyDebuff: (params) => new ApplyDebuff(params),
    BoostTurnMeter: (params) => new BoostTurnMeter(params),
    DealDamage: (params) => new DealDamage(params),
    IncreaseCD: (params) => new IncreaseCD(params),
    ResetCD: (params) => new ResetCD(params),
    IncreaseDebuffDuration: (params) => new IncreaseDebuffDuration(params),
    FullCleanse: (params) => new FullCleanse(params),
};