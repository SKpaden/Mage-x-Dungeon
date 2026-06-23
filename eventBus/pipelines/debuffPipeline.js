import { Debuff } from "../../game/debuffs.js";
import { delay } from "../../ui/helpers.js";

export function registerDebuffPipeline(engine) {

    engine.eventBus.on("intent:applyDebuff", async ctx => {

        const debuff = ctx.debuff;   // the Debuff to apply
        const source = ctx.source;

        const affectedTargets = ctx.affectedTargets;

        if (ctx.flags.popupDelay){
            await delay(ctx.scene, ctx.data.delay);
        }

        for (let i = 0; i < affectedTargets.length; i++){
            const currentIndex = affectedTargets[i];
            const currentTarget = ctx.enemies[currentIndex];
            if (currentTarget.getData("hp") <= 0) continue;  // skip if target died from damage

            ctx.currentTarget = currentTarget;

            // 1. Pre-event:
            await engine.eventBus.emit("beforeApplyDebuff", ctx);  // potentially mutates ctx with flags
    
            // 2. Apply debuff, if allowed:
            if (!ctx.blocked){
                const debuffs = currentTarget.getData('debuffs') || [];
                if (Debuff.allowDebuff(debuffs, debuff.name)){
                    debuffs.push(debuff.createCopy(source));
                    currentTarget.setData('debuffs', debuffs);
                }
        
                // 3. Post-event:
                await engine.eventBus.emit("afterApplyDebuff", ctx);
            } else {
                await engine.eventBus.emit("onDebuffBlocked", ctx);  // for UI and perhaps passives
            }
        }
    });

    engine.eventBus.on("intent:incDebuffDuration", async ctx => {
        const affectedTargets = ctx.affectedTargets;
        const includedDebuffs = ctx.data.includedDebuffs;  // not used currently

        for (let i = 0; i < affectedTargets.length; i++){
            const currentIndex = affectedTargets[i];
            const currentTarget = ctx.enemies[currentIndex];
            if (currentTarget.getData("hp") <= 0) continue;  // skip if target died from damage

            ctx.currentTarget = currentTarget;
            ctx.data.modifiedAmount = ctx.data.amount;

            // 1. Pre-event:
            await engine.eventBus.emit("beforeIncDebuffDuration", ctx);  // potentially mutates ctx with flags and modifiedAmount data
    
            // 2. Apply debuff, if allowed:
            if (!ctx.flags.blocked){
                let incCount = 0;
                const debuffs = currentTarget.getData('debuffs');
                debuffs.forEach(debuff => {
                    // Exclude cc debuffs:
                    if (debuff.type !== 'cc'){
                        debuff.duration += ctx.data.modifiedAmount;
                        incCount++;
                    }
                });
        
                // 3. Post-event:
                await engine.eventBus.emit("afterIncDebuffDuration", ctx);
                if (incCount){
                    ctx.data.text = "Increase Debuff\nDuration x" + incCount;
                    await engine.eventBus.emit("ui:negativeText", ctx);
                }
            } else {
                // await engine.eventBus.emit("onEffectBlocked", ctx);  // for UI and perhaps passives
                ctx.data.text = "Immune";
                await engine.eventBus.emit("ui:positiveText", ctx);
            }
        }
    });
}