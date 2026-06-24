import { getAttackOrder } from "./helpers.js";
import { dmgTarget, getAffectedTargetsAsContainers } from "../game/combat.js";
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
    // execute(scene, source, target, index, allies, enemies){}

    execute(skillContext){}
}

// Activates all poison stacks on targets, more poisons = more damage.
/**
 * Params: { area: 'all'/'adjacent'/'single' }
 */
export class ActivatePoison extends SkillPart{
    // async execute(scene, source, target, index, allies, enemies){
    async execute(context){
        const { area = 'all'} = this.params;
        const affectedTargets = getAffectedTargetsAsContainers(area, context.index, context.enemies);
        context.affectedTargets = affectedTargets;
        await context.scene.combatEngine.eventBus.emit("intent:activatePoison", context);
    }
}

// Ally attack: Allies attack target with default skill.
/**
 * Params: { amount: 'all'/1,2,3,4,5 }
 */
export class AllyAttack extends SkillPart{  // works overall, but logQueue is not processed correctly => logQueue rework needed
    // async execute(scene, source, target, index, allies, enemies){
    async execute(context){
        const { amount = 'all'} = this.params;
        let maxAmount = amount === 'all' ? context.allies.length : amount;
        let hasAttacked = 0;
        const shuffledIndexes = getAttackOrder(context.source.getData('teamIndex'), context.allies.length);
        for (let i = 0; i < shuffledIndexes.length; i++) {
            const attackerIndex = shuffledIndexes[i];
            const ally = context.allies[attackerIndex];
            const char = ally.getData('char')  // get char class to access skills
            const allyHp = ally.getData('hp');
            if (allyHp > 0){
                const allySkill = char.skills[0];
                await allySkill.apply(context.scene, ally, context.target, context.index, context.allies, context.enemies);
                await delay(context.scene, uiStats.debuffDelay / 2);
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
    // async execute(scene, source, target, index, allies, enemies){
    async execute(context){
        const { area = 'single', debuff, targets = 'enemies'} = this.params;
        const targetedTeam = targets === 'enemies' ? context.enemies : context.allies;
        const affectedTargets = getAffectedTargetsAsContainers(area, context.index, targetedTeam);
        // Set SkillPart-specific context data:
        context.affectedTargets = affectedTargets;
        context.data.debuff = debuff;
        // Trigger event:
        await context.scene.combatEngine.eventBus.emit("intent:applyDebuff", context);
    }
}

// Boost turn meter.
/**
 * Params: { area: 'all'/'adjacent'/'single', amount: %}
 */
export class BoostTurnMeter extends SkillPart{
    // async execute(scene, source, target, index, allies, enemies){
    async execute(context){
        const { area = 'single', amount} = this.params;
        const affectedTargets = getAffectedTargetsAsContainers(area, context.index, context.allies);
        // Set context data for this SkillPart:
        context.affectedTargets = affectedTargets;
        context.data.amount = amount;
        // Trigger event:
        await context.scene.combatEngine.eventBus.emit("intent:boostTM", context);
    }
}

// Dealing damage part of a skill (old effect).
/**
 * Params: { area: 'all'/'single', dmg: int, element: 'Phyisical'/'Fire', skillName: 'Fireball}
 */
export class DealDamage extends SkillPart{
    // async execute(scene, source, target, index, allies, enemies){
    async execute(skillContext){
        const { area = 'single', dmg, element = 'Physical'} = this.params;
        const affectedTargets = getAffectedTargetsAsContainers(area, skillContext.index, skillContext.enemies);
        skillContext.affectedTargets = affectedTargets;

        const logQueueKey = getLogTarget();  // where to log?
        skillContext.logQueueKey = logQueueKey;

        // Should a debuff be applied from an elemental Skill?
        let debuff = null;
        if (element !== 'Physical'){
            debuff = Debuff.getDefaultElementalDebuff(element);
        }

        let debuffsApplied = 0;

        // Trigger dmg pipeline once:
        skillContext.data.dmg = dmg;
        skillContext.data.element = element;
        await skillContext.scene.combatEngine.eventBus.emit("intent:dealDamage", skillContext);  // works but no UI updates etc

        // Default elemental debuff:
        if (debuff && skillContext.flags.allowElementalDebuff){  // doesn't work, only 1 flag for all targets...
            // Add a small delay between damage numbers and debuff popup:
            skillContext.affectedTargets = skillContext.data.nextTargets;
            skillContext.flags.popupDelay = true;
            skillContext.data.delay = 300;
            skillContext.data.debuff = debuff;
            await skillContext.scene.combatEngine.eventBus.emit("intent:applyDebuff", skillContext);
        }
    }
}

// Removes all debuffs from one or more team members.
/**
 * Params: { area: 'all'/'single'}
 */
export class FullCleanse extends SkillPart{
    // execute(scene, source, target, index, allies, enemies){
    async execute(context){
        const { area = 'all' } = this.params;
        const affectedTargets = getAffectedTargetsAsContainers(area, context.index, context.allies);
        await context.scene.combatEngine.eventBus.emit("intent:fullCleanse", context);
    }
}

// Healing after dealing damage.
/**
 * Params: { percentage: 0.3}
 */
export class HealBasedOnDamage extends SkillPart {
    async execute(context) {
        const percentage = this.params.percentage;
        // const area = this.params.area;

        context.data.amount = percentage;
        context.affectedTargets = [context.source];
        await context.scene.combatEngine.eventBus.emit("intent:healBasedOnDamage", context);
    }
}


// Increases CDs on enemy team.
/**
 * Params: { area: 'all'/'single'}
 */
export class IncreaseCD extends SkillPart{
    // execute(scene, source, target, index, allies, enemies){
    async execute(context){
        const { area = 'all'} = this.params;
        const affectedTargets = getAffectedTargetsAsContainers(area, context.index, context.enemies);
        context.affectedTargets = affectedTargets;
        await context.scene.combatEngine.eventBus.emit("intent:increaseCD", context);
    }
}
// Increases CDs on enemy team.
/**
 * Params: { area: 'all'/'adjacent'/'single', includedDebuffs: ['Burn', 'Poison']}
 */
export class IncreaseDebuffDuration extends SkillPart{
    // execute(scene, source, target, index, allies, enemies){
    async execute(context){
        const { area = 'all', includeDebuffs = 'all', amount = 1} = this.params;
        const affectedTargets = getAffectedTargetsAsContainers(area, context.index, context.enemies);
        context.affectedTargets = affectedTargets;
        context.data.amount = amount;
        context.data.includedDebuffs = includeDebuffs;
        await context.scene.combatEngine.eventBus.emit("intent:incDebuffDuration", context);
    }
}
// Resets the CDs on one or more team members.
/**
 * Params: { area: 'all'/'single'}
 */
export class ResetCD extends SkillPart{
    // execute(scene, source, target, index, allies, enemies){
    async execute(context){
        const { area = 'all'} = this.params;
        const affectedTargets = getAffectedTargetsAsContainers(area, context.index, context.allies);
        context.affectedTargets = affectedTargets;
        await context.scene.combatEngine.eventBus.emit("intent:resetCD", context);
    }
}

// Resets the CDs on one or more team members.
/**
 * Params: { area: 'all'/'single', hp: 0.5, tm: 0.5}
 */
export class Revive extends SkillPart{
    // execute(scene, source, target, index, allies, enemies){
    async execute(context){
        const { area = 'all', hp, tm} = this.params;
        const affectedTargets = getAffectedTargetsAsContainers(area, context.index, context.allies);
        context.affectedTargets = affectedTargets;
        context.data.hp = hp;
        context.data.tm = tm;
        await context.scene.combatEngine.eventBus.emit("intent:revive", context);
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
    HealBasedOnDamage: (params) => new HealBasedOnDamage(params),
    IncreaseCD: (params) => new IncreaseCD(params),
    ResetCD: (params) => new ResetCD(params),
    Revive: (params) => new Revive(params),
    IncreaseDebuffDuration: (params) => new IncreaseDebuffDuration(params),
    FullCleanse: (params) => new FullCleanse(params),
};