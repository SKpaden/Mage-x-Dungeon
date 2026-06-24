

export function registerHealPipeline(engine) {

    // Write to results:
    engine.eventBus.on("afterHeal", async ctx => {
        const healAmount = ctx.data.healAmount;
        // Write to context for logging or other SkillParts:
        const prevHealing = ctx.results.healingDone.get(ctx.source) ?? 0;
        ctx.results.healingDone.set(ctx.source, prevHealing + healAmount);
    });

    engine.eventBus.on("intent:heal", async ctx => {
        const amount = ctx.data.amount;
        const affectedTargets = ctx.affectedTargets;

        for (const currentTarget of affectedTargets){
            if(currentTarget.getData("hp") <= 0) continue;

            ctx.currentTarget = currentTarget;
            ctx.data.modifiedAmount = amount;  // for mutating by events
            const currentChar = currentTarget.getData("char");

            // 1. Pre-event: Increase (ally Passive) or decrease (enemy Passive) modifiedAmount.
            // Problematic with only 1 event because of ordering, but is fine for now.
            await engine.eventBus.emit("beforeHeal", ctx);  // potentially mutates modifiedAmount

            const healAmount = Math.floor(ctx.data.modifiedAmount);
            const oldHp = currentTarget.getData('hp');
            const newAmount = Math.min(currentChar.statManager.getBaseStat('hp'), oldHp + healAmount);
            currentChar.statManager.setCurrentStat('hp', newAmount);
            currentTarget.setData("hp", newAmount);

            ctx.data.healAmount = healAmount;
            await engine.eventBus.emit("afterHeal", ctx);

            ctx.data.text = `+${healAmount}${ctx.flags.leeched ? '\nLeech' : ''}`;
            await engine.eventBus.emit("ui:positiveText", ctx);  // UI popup
        }        
    });

    engine.eventBus.on("intent:healBasedOnDamage", async ctx => {

        const amount = ctx.data.amount;
        const affectedTargets = ctx.affectedTargets;

        for (let i = 0; i < affectedTargets.length; i++){
            const currentTarget = affectedTargets[i];
            if(currentTarget.getData("hp") <= 0) continue;

            ctx.currentTarget = currentTarget;
            ctx.data.modifiedAmount = amount;  // for mutating by events
            const currentChar = currentTarget.getData("char");

            // 1. Pre-event: Increase (ally Passive) or decrease (enemy Passive) modifiedAmount.
            // Problematic with only 1 event because of ordering, but is fine for now.
            await engine.eventBus.emit("beforeHeal", ctx);  // potentially mutates modifiedAmount

            let totalDamage = 0;
            for (const dmg of ctx.results.damageDealt.values()) {
                totalDamage += dmg;
            }

            const healAmount = Math.floor(totalDamage * ctx.data.modifiedAmount);
            const oldHp = currentTarget.getData('hp');
            const newAmount = Math.min(currentChar.statManager.getBaseStat('hp'), oldHp + healAmount);
            currentChar.statManager.setCurrentStat('hp', newAmount);
            currentTarget.setData("hp", newAmount);

            ctx.data.healAmount = healAmount;
            await engine.eventBus.emit("afterHeal", ctx);

            ctx.data.text = `+${healAmount}`;
            await engine.eventBus.emit("ui:positiveText", ctx);  // UI popup
        }
    });
}