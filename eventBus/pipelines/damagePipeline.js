import { StatManager } from "../../data/statManager.js";
import { Debuff } from "../../game/debuffs.js";
import { gameState } from "../../game/gameState.js";
import { delay } from "../../ui/helpers.js";
import { uiStats } from "../../ui/uiStats.js";

export function registerDamagePipeline(engine) {

    // 1. Entry point: a SkillPart emitted an intent:
    engine.eventBus.on("intent:dealDamage", async ctx => {
        await engine.eventBus.emit("ui:attack", ctx);  // trigger attack Tween

        ctx.data.totalLeechHeal = 0;  // potentially heal from Leech

        for (let i = 0; i < ctx.affectedTargets.length; i++){
            const currentTarget = ctx.affectedTargets[i];
            // Check if the enemy is still alive (caused issue with AllyAttack SkillPart ==> same death counted multiple times):
            if (StatManager.getContainerStat(currentTarget, "hp") <= 0) continue;  // already dead

            ctx.currentTarget = currentTarget;
            ctx.data.modifiedDamage = ctx.data.dmg;  // reset modifiedDamage

            // 2. Attacker-side modifications:
            await engine.eventBus.emit("beforeDealDamage", ctx);  // mutate ctx.modifiedDamage
    
            // 3. Defender-side modifications:
            await engine.eventBus.emit("beforeTakeDamage", ctx);  // mutate ctx.modifiedDamage
    
            // 4. Apply resistances:
            const defenderChar = ctx.currentTarget.getData('char');
    
            // ctx.modifiedDamage *= 20;
    
            // 5. Apply final damage:
            const hp = StatManager.getContainerStat(ctx.currentTarget, "hp");
            const newHp = Math.max(0, hp - ctx.data.modifiedDamage);
            StatManager.setContainerStat(ctx.currentTarget, "hp", newHp);
    
            // 6. Notify listeners:
            await engine.eventBus.emit("afterDealDamage", ctx);  // Passives hook into this + Leech
            await engine.eventBus.emit("afterTakeDamage", ctx);  // triggers Reactions
    
            // 7. Death check:
            if (newHp <= 0) {
                await engine.eventBus.emit("onActiveDeath", ctx);
            }
        }
        await engine.eventBus.emit("afterAllDamage", ctx);  // all targets processed

        await engine.eventBus.emit("intent:processReactions", ctx);  // trigger queued Reactions
    });

    engine.eventBus.on("intent:dealReactionDamage", async ctx => {
        const reaction = ctx.data.reaction;
        const debuff = reaction.debuff;
        ctx.data.debuff = debuff;

        for (const currentTarget of ctx.affectedTargets){
            // Check if the enemy is still alive (caused issue with AllyAttack SkillPart ==> same death counted multiple times):
            if (StatManager.getContainerStat(currentTarget, "hp") <= 0) continue;  // already dead

            ctx.currentTarget = currentTarget;
            ctx.data.modifiedDamage = ctx.data.dmg;  // reset modifiedDamage

            // 2. Attacker-side modifications:
            await engine.eventBus.emit("beforeDealDamage", ctx);  // mutate ctx.modifiedDamage
    
            // 3. Defender-side modifications:
            await engine.eventBus.emit("beforeTakeDamage", ctx);  // mutate ctx.modifiedDamage
    
            // 4. Apply resistances:
            const defenderChar = ctx.currentTarget.getData('char');

            // 5. Apply final damage:
            const hp = StatManager.getContainerStat(ctx.currentTarget, "hp");
            const newHp = Math.max(0, hp - ctx.data.modifiedDamage);
            StatManager.setContainerStat(ctx.currentTarget, "hp", newHp);

            ctx.data.text = `-${ctx.data.modifiedDamage}\n${reaction.name}`

            ctx.scene.cameras.main.shake(200, 0.01);  // shake screen

            // Logging:
            if (!gameState.logQueue[reaction.name]['targets'].includes(currentTarget)) gameState.logQueue[reaction.name]['targets'].push(currentTarget);
            gameState.logQueue[reaction.name]['dmg'].push(ctx.data.modifiedDamage);

            // 6. Notify listeners:
            await engine.eventBus.emit("afterDealReactionDamage", ctx);  // Passives hook into this, but not Leech
            await engine.eventBus.emit("ui:takeDamage", ctx);  // triggers Reactions
    
            // 7. Death check:
            if (newHp <= 0) {
                await engine.eventBus.emit("onActiveDeath", ctx);
            } else {
                if (debuff) await engine.eventBus.emit("intent:applyDebuff", ctx);
            }
        }
        ctx.data.debuff = null;  // clear data
        
    });

    engine.eventBus.on("afterAllDamage", async ctx => {
        if (ctx.data.totalLeechHeal > 0) {
            ctx.affectedTargets = [ctx.source];
            ctx.data.amount = ctx.data.totalLeechHeal;
            ctx.flags.leeched = true;
            await delay(ctx.scene, uiStats.attackTweenDuration*2);  // let attack finish (*2 because of yoyo = true)
            await engine.eventBus.emit("intent:heal", ctx);
            ctx.flags.leeched = false;  // reset flag
        }
    });

    // Global check for Leech Debuff:
    engine.eventBus.on("afterDealDamage", async ctx => {
        const currentTargetDebuffs = ctx.currentTarget.getData('debuffs');
        if (Debuff.containsDebuff(currentTargetDebuffs, 'Leech')){
            ctx.data.totalLeechHeal += ctx.data.modifiedDamage * 0.2;  // fixed 20% Leech heal
        }
    });

    // Global hook for tracking damage and preparing follow-up debuff application.
    engine.eventBus.on("afterTakeDamage", async ctx => {
        const prevDmg = ctx.results.damageDealt.get(ctx.currentTarget) ?? 0;
        ctx.results.damageDealt.set(ctx.currentTarget, prevDmg + ctx.data.modifiedDamage);  // write to context for other SkillParts (heal based on dmg etc.)

        if (!gameState.logQueue[ctx.logQueueKey]['targets'].includes(ctx.currentTarget)) {
            gameState.logQueue[ctx.logQueueKey]['targets'].push(ctx.currentTarget);
        }
        gameState.logQueue[ctx.logQueueKey]['dmg'].push(ctx.data.modifiedDamage);
    });
}
