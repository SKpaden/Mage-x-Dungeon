import { getAffectedTargets, processReactions } from "../game/combat.js";
import { boostTurnMeter } from "../game/turnMeterManager.js";
import { showNegativePopup, showPositivePopup } from "../ui/popups.js";
import { updateDebuffDsiplay } from "../ui/portraitFactory.js";

// Class to extend from. SkillParts are reusable actions inside a skill (e.g., decrease CD).
class SkillPart{
    constructor(params = {}){
        this.params = params;
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
            updateDebuffDsiplay(scene, unit);
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
        let affectedTargets;
        switch (area){
            case 'all':
                affectedTargets = getAffectedTargets('all', index, allies);
                break;
            case 'adjacent':
                affectedTargets = getAffectedTargets('adjacent', index, allies);
                break;
            case 'single':
                affectedTargets = [target];
                break;
            default:
                console.error("UNDEFINED AREA IN ApplyDebuff SkillPart!" + area);
        }
        affectedTargets.forEach(i => {
            const unit = allies[i];
            boostTurnMeter(scene, unit, amount);
            showPositivePopup(scene, unit.x, unit.y, 'Boost\nTurn Meter');
        });
    }
}

// Dealing damage part of a skill (old effect).
/**
 * Params: { area: 'all'/'single', effect: new Effect(...), skillName: skill.name}
 */
export class DealDamage extends SkillPart{
    async execute(scene, source, target, index, allies, enemies){
        const { area = 'single', effect, skillName} = this.params;
        await processReactions(scene, source, target, index, allies, enemies, area, effect, skillName);
    }
}
// Increases CDs on enemy team.
/**
 * Params: { area: 'all'/'single'}
 */
export class IncreaseCD extends SkillPart{
    execute(scene, source, target, index, allies, enemies){
        const { area = 'all'} = this.params;
        switch (area){
            case 'all':
                enemies.forEach(container => {
                    const char = container.getData('char');
                    const charHp = container.getData('hp');
                    if (charHp > 0 && char.lockout()) showNegativePopup(scene, container.x, container.y, "Increase\nCooldown");  // maybe pass source as arg to factor in passives
                });
                break;
            case 'single':
                if (target.getData('char').lockout()) showNegativePopup(scene, target.x, target.y, "Increase\nCooldown");
                break;
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
                        updateDebuffDsiplay(scene, ally);
                        showPositivePopup(scene, ally.x, ally.y, "Cleanse");
                    }
                })
                break;
            case 'single':
                target.setData('debuffs', []);
                updateDebuffDsiplay(scene, target);
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
    if (className === 'DealDamage'){  // unique behavior for damage skills
        return skillPartFactories[className]({area: params.area, effect: params.effect.copy(), skillName: params.skillName});
    }
    else {
        return skillPartFactories[className](params);
    }
}

// To dynamically create SkillPart subclasses based on skill template:
const skillPartFactories = {
    ApplyDebuff: (params) => new ApplyDebuff(params),
    BoostTurnMeter: (params) => new BoostTurnMeter(params),
    DealDamage: (params) => new DealDamage(params),
    IncreaseCD: (params) => new IncreaseCD(params),
    ResetCD: (params) => new ResetCD(params),
    IncreaseDebuffDuration: (params) => new IncreaseDebuffDuration(params),
    FullCleanse: (params) => new FullCleanse(params),
};