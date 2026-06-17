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

        for (let i = 0; i < ctx.affectedTargets.length; i++){
            const currentIndex = ctx.affectedTargets[i];
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
}