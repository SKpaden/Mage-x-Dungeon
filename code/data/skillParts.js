import { checkWinner, processReactions } from "../game/combat.js";
import { gameState } from "../game/gameState.js";
import { processLogQueue } from "../ui/combatLog.js";
import { showNegativePopup, showPositivePopup } from "../ui/popups.js";
import { updateDebuffDsiplay } from "../ui/portraitFactory.js";
import { delay } from "../ui/helpers.js";
import { uiStats } from "../ui/uiStats.js";

// Class to extend from. SkillParts are reusable actions inside a skill (e.g., decrease CD).
class SkillPart{
    constructor(params = {}){
        this.params = params;
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
                    if (char.lockout()) showNegativePopup(scene, container.x, container.y, "Increase\nCooldown");  // maybe pass source as arg to factor in passives
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
                    if (char.resetCDs()) showPositivePopup(scene, container.x, container.y, "Decrease\nCooldown");  // maybe pass source as arg to factor in passives
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
                    updateDebuffDsiplay(scene, ally);
                    showPositivePopup(scene, ally.x, ally.y, "Cleanse");
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