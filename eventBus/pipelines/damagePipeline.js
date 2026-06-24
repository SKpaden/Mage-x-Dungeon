import { Debuff } from "../../game/debuffs.js";
import { gameState } from "../../game/gameState.js";
import { Reaction } from "../../game/reactions.js";
import { getDefaultElementColor } from "../../ui/elementColors.js";
import { updateDebuffDisplay } from "../../ui/portraitFactory.js";

export function registerDamagePipeline(engine) {

    engine.eventBus.on("damageTarget", async ctx => {  // not used yet
        const target = ctx.currentTarget;
        if (currentTarget.getData("hp") <= 0) return;  // already dead

        ctx.data.modifiedDamage = ctx.data.dmg;
        // 2. Attacker-side modifications:
        await engine.eventBus.emit("beforeDealDamage", ctx);  // mutate ctx.modifiedDamage

        // 3. Defender-side modifications:
        await engine.eventBus.emit("beforeTakeDamage", ctx);  // mutate ctx.modifiedDamage

        const defenderChar = ctx.currentTarget.getData('char');

        // 5. Apply final damage:
        const hp = ctx.currentTarget.getData('hp');
        const newHp = Math.max(0, hp - ctx.modifiedDamage);
        ctx.currentTarget.setData('hp', newHp);

        // 6. Notify listeners:
        await engine.eventBus.emit("afterDealDamage", ctx);  // Passives hook into this + Leech
        await engine.eventBus.emit("afterTakeDamage", ctx);  // triggers Reactions

        await engine.eventBus.emit("ui:takeDamage", ctx);

        // 7. Death check:
        if (newHp <= 0) {
            await engine.eventBus.emit("onActiveDeath", ctx);
        }
    });

    // 1. Entry point: a SkillPart emitted an intent:
    engine.eventBus.on("intent:dealDamage", async ctx => {
        await engine.eventBus.emit("ui:attack", ctx);  // trigger attack Tween

        for (let i = 0; i < ctx.affectedTargets.length; i++){
            const currentIndex = ctx.affectedTargets[i];
            const currentTarget = ctx.enemies[currentIndex];
            // Check if the enemy is still alive (caused issue with AllyAttack SkillPart ==> same death counted multiple times):
            if (currentTarget.getData("hp") <= 0) continue;  // already dead

            ctx.currentTarget = currentTarget;
            ctx.modifiedDamage = ctx.dmg;  // reset modifiedDamage

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
        // Placeholder:
        gameState.logQueue[ctx.logQueueKey].debuffsApplied = ctx.results.debuffsApplied.length+99;
        // I need await here, otherwise it doesn't work, but await can't be used here:
        await Reaction.processReactionQueue(ctx.scene, ctx.source, ctx.allies, ctx.enemies);  // process Reactions in gameState queue
    });

    // Global check for Leech Debuff:
    engine.eventBus.on("afterDealDamage", async ctx => {
        const currentTargetDebuffs = ctx.currentTarget.getData('debuffs');
        if (Debuff.containsDebuff(currentTargetDebuffs, 'Leech')){
        }
    });

    // TODO: Make the Reactions better:
    // Global hook for triggering Reactions:
    engine.eventBus.on("afterTakeDamage", async ctx => {        
        const char = ctx.currentTarget.getData('char');
        const debuffs = ctx.currentTarget.getData('debuffs');
        let allowElementalDebuff = true;
        let finalDmg = ctx.modifiedDamage;

        const prevDmg = ctx.results.damageDealt.get(ctx.currentTarget) ?? 0;
        ctx.results.damageDealt.set(ctx.currentTarget, prevDmg + finalDmg);  // write to context for other SkillParts (heal based on dmg etc.)

        // Look at all debuffs if any:
        if (debuffs.length > 0){
            const debuffFilter = {};  // what debuffs get removed by Reactions?
            for (let i = 0; i < debuffs.length; i++) {
                const debuff = debuffs[i];
                // Fixed major BUG: Attacking Scared enemies would remove the debuff because it's not elemental and therefore not set in debuffFilter!!!!!  
                debuffFilter[debuff.name] = true;
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
                    } 
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
