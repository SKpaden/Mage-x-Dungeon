

export function registerCDPipeline(engine) {

    // 1. Entry point: a SkillPart emitted an intent:
    engine.eventBus.on("intent:increaseCD", async ctx => {

        for (let i = 0; i < ctx.affectedTargets.length; i++){
            const currentIndex = ctx.affectedTargets[i];
            const currentTarget = ctx.enemies[currentIndex];
            // Check if the enemy is still alive (caused issue with AllyAttack SkillPart ==> same death counted multiple times):
            if (currentTarget.getData("hp") <= 0) continue;  // already dead

            ctx.currentTarget = currentTarget;
            ctx.flags.blocked = false;  // reset flags

            // 2. Only one pre-event modifications:
            await engine.eventBus.emit("beforeIncCD", ctx);  // Passives that block/are immune hook into this
            if (ctx.flags.blocked){  // passive blocked effect
                ctx.data.text = "Immune";
                await engine.eventBus.emit("ui:positiveText", ctx);
            } else {
                const char = currentTarget.getData('char');
                char.lockout();  // put CD

                await engine.eventBus.emit("afterIncCD", ctx);
                ctx.data.text = "Increase\nCooldown";
                await engine.eventBus.emit("ui:negativeText", ctx);
            }
        }
    });

    engine.eventBus.on("intent:resetCD", async ctx => {
        for (let i = 0; i < ctx.affectedTargets.length; i++){
            const currentIndex = ctx.affectedTargets[i];
            const currentTarget = ctx.allies[currentIndex];
            // Check if the enemy is still alive (caused issue with AllyAttack SkillPart ==> same death counted multiple times):
            if (currentTarget.getData("hp") <= 0) continue;  // already dead

            ctx.currentTarget = currentTarget;
            ctx.flags.blocked = false;  // reset flags

            // 2. Only one pre-event modifications:
            await engine.eventBus.emit("beforeRedCD", ctx);  // Passives that block/are immune hook into this

            if (ctx.flags.blocked){  // passive blocked effect
                ctx.data.text = "Blocked";
                await engine.eventBus.emit("ui:negativeText", ctx);
            } else {
                const char = currentTarget.getData('char');
                char.resetCDs();
                await engine.eventBus.emit("afterIncCD", ctx);
                ctx.data.text = "Decrease\nCooldown";
                await engine.eventBus.emit("ui:positiveText", ctx);
            }
        }
    });
}
