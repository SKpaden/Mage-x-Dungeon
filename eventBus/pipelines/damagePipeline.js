import { Debuff } from "../../game/debuffs.js";
import { gameState } from "../../game/gameState.js";
import { Reaction } from "../../game/reactions.js";
import { getDefaultElementColor } from "../../ui/elementColors.js";
import { updateDebuffDisplay } from "../../ui/portraitFactory.js";

export function registerDamagePipeline(engine) {

    // 1. Entry point: a SkillPart emitted an intent:
    engine.eventBus.on("intent:dealDamage", async ctx => {
        await engine.eventBus.emit("ui:attack", ctx);  // trigger attack Tween
        
        // Prepare context fields:
        ctx.modifiedDamage = ctx.dmg;

        for (let i = 0; i < ctx.affectedTargets.length; i++){
            const currentIndex = ctx.affectedTargets[i];
            const currentTarget = ctx.enemies[currentIndex];
            ctx.currentTarget = currentTarget;

            // 2. Attacker-side modifications:
            await engine.eventBus.emit("beforeDealDamage", ctx);  // mutate ctx.modifiedDamage
    
            // 3. Defender-side modifications:
            await engine.eventBus.emit("beforeTakeDamage", ctx);  // mutate ctx.modifiedDamage
    
            // 4. Apply resistances:
            const defenderChar = ctx.currentTarget.getData('char');
    
            // ctx.modifiedDamage *= 20;
    
            // 5. Apply final damage:
            const hp = ctx.currentTarget.getData('hp');
            const newHp = Math.max(0, hp - ctx.modifiedDamage);
            ctx.currentTarget.setData('hp', newHp);
    
            // 6. Notify listeners:
            await engine.eventBus.emit("afterDealDamage", ctx);  // Passives hook into this + Leech
            await engine.eventBus.emit("afterTakeDamage", ctx);  // triggers Reactions
    
            // 7. Death check:
            if (newHp <= 0) {
                await engine.eventBus.emit("onActiveDeath", ctx);
            }
        }
        gameState.logQueue[ctx.logQueueKey].debuffsApplied += 2;
        // I need await here, otherwise it doesn't work, but await can't be used here:
        await Reaction.processReactionQueue(ctx.scene, ctx.source, ctx.allies, ctx.enemies);  // process Reactions in gameState queue
    });

    // Global check for Leech Debuff:
    engine.eventBus.on("afterDealDamage", async ctx => {
        const currentTargetDebuffs = ctx.currentTarget.getData('debuffs');
        if (Debuff.containsDebuff(currentTargetDebuffs, 'Leech')){
            await engine.eventBus.emit("intent:heal", ctx);
        }
    });

    // Global hook for triggering Reactions:
    engine.eventBus.on("afterTakeDamage", async ctx => {
        if (ctx.currentTarget.getData("hp") <= 0) return;  // already dead
        
        const char = ctx.currentTarget.getData('char');
        const debuffs = ctx.currentTarget.getData('debuffs');
        let allowElementalDebuff = true;
        let finalDmg = ctx.modifiedDamage;

        // Look at all debuffs if any:
        if (debuffs.length > 0){
            const debuffFilter = {};  // what debuffs get removed by Reactions?
            for (let i = 0; i < debuffs.length; i++) {
                const debuff = debuffs[i];
                if (debuff.type === 'elemental') {  // only elemental debuffs can trigger Reactions
                    // Use these stats maybe to tweak dmg of Reaction:
                    const duration = debuff.duration;
                    finalDmg = finalDmg*duration;
                    
                    const triggeredReaction = Reaction.getTriggeredReaction(debuff, ctx.element, finalDmg);
                    if (triggeredReaction) {
                        debuffFilter[debuff.name] = false;
                        allowElementalDebuff = false;  // element triggered Reaction ==> don't place default elemental debuff
                        gameState.reactionQueue.push(Reaction.getQueueEntry(triggeredReaction, ctx.currentTarget, ctx.enemies));
                        gameState.logQueue[ctx.logQueueKey].reactionsTriggered++;
                    } else {
                        debuffFilter[debuff.name] = true;
                    }
                // Fixed major BUG: Attacking Scared enemies would remove the debuff because it's not elemental and therefore not set in debuffFilter!!!!!    
                } else {
                    debuffFilter[debuff.name] = true;  // keep non-elemental ones
                }
            }
            // Update debuffs:
            const newDebuffs = debuffs.filter((debuff) => debuffFilter[debuff.name]);
            ctx.currentTarget.setData('debuffs', newDebuffs);
            updateDebuffDisplay(ctx.scene, ctx.currentTarget);
        }

        // Add to logQueue:
        if (!gameState.logQueue[ctx.logQueueKey]['targets'].includes(ctx.currentTarget)) gameState.logQueue[ctx.logQueueKey]['targets'].push(ctx.currentTarget);
        gameState.logQueue[ctx.logQueueKey]['dmg'].push(finalDmg);
        
        ctx.allowElementalDebuff = allowElementalDebuff;  // set flag
    })
}
