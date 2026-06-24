import { Debuff } from "../../game/debuffs.js";
import { delay } from "../../ui/helpers.js";

export function registerDebuffPipeline(engine) {

    // 1. Entry point: a SkillPart emitted an intent:
    engine.eventBus.on("intent:activatePoison", async ctx => {
        const affectedTargets = ctx.affectedTargets;

        for (let i = 0; i < affectedTargets.length; i++){
            const unitIndex = affectedTargets[i];
            const currentTarget = ctx.enemies[unitIndex];
            if (currentTarget.getData("hp") <= 0) continue;

            ctx.currentTarget = currentTarget;

            const debuffs = currentTarget.getData('debuffs');
            // Count poisons:
            let poisonCount = 0;
            let dmgCount = 0;
            const newDebuffs = debuffs.filter(debuff => {
                if (debuff.name === 'Poison'){
                    poisonCount += debuff.duration;
                    dmgCount += debuff.dmgPerTurn*debuff.duration;
                    return false;
                } return true;
            });
            // // Remove poisons:
            // const newDebuffs = debuffs.filter((debuff) => {
            //     if (debuff.name === 'Poison') return false;
            //     return true;
            // });
            currentTarget.setData('debuffs', newDebuffs);

            ctx.data.color = '#007700';
            ctx.data.dmg = dmgCount;
            ctx.data.modifiedDamage = ctx.data.dmg;  // currently, no other events called ==> no mutation of this value, not sure how to handle "fixed" poison damage yet
            ctx.data.text = `-${ctx.data.dmg}\nPoison x${poisonCount}`;

            // 5. Apply final damage:
            const hp = ctx.currentTarget.getData('hp');
            const newHp = Math.max(0, hp - ctx.data.modifiedDamage);
            ctx.currentTarget.setData('hp', newHp);

            await engine.eventBus.emit("ui:takeDamage", ctx);
            await engine.eventBus.emit("ui:debuffUpdate", ctx);

            if (newHp <= 0) {
                await engine.eventBus.emit("onActiveDeath", ctx);
            }
        }
    });

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

    engine.eventBus.on("intent:fullCleanse", async ctx => {
        const affectedTargets = ctx.affectedTargets;
        for (let i = 0; i < affectedTargets.length; i++){
            const currentIndex = affectedTargets[i];
            const currentTarget = ctx.allies[currentIndex];
            if (currentTarget.getData("hp") <= 0) continue;  // skip if target died from damage

            ctx.currentTarget = currentTarget;
            ctx.data.blockedCleanses = {};  // maybe store which ones are allowed and which ones aren't
            ctx.flags.blocked = false;

            // 1. Pre-event:
            await engine.eventBus.emit("beforeCleanseDebuffs", ctx);  // potentially mutates ctx with flags and data
    
            // 2. Cleanse, if allowed:
            if (!ctx.flags.blocked){
                currentTarget.setData("debuffs", []);
        
                // 3. Post-event:
                await engine.eventBus.emit("afterCleanseDebuffs", ctx);
                await engine.eventBus.emit("ui:debuffUpdate", ctx);
                ctx.data.text = "Cleanse";
                await engine.eventBus.emit("ui:positiveText", ctx);
            } else {
                await engine.eventBus.emit("onCleanseBlocked", ctx);  // for UI and perhaps passives
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
                    await engine.eventBus.emit("ui:debuffUpdate", ctx);
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