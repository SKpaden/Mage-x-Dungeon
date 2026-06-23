

export function registerCDPipeline(engine) {

    // 1. Entry point: a SkillPart emitted an intent:
    engine.eventBus.on("intent:increaseCD", async ctx => {

        for (let i = 0; i < ctx.affectedTargets.length; i++){
            const currentIndex = ctx.affectedTargets[i];
            const currentTarget = ctx.enemies[currentIndex];
            // Check if the enemy is still alive (caused issue with AllyAttack SkillPart ==> same death counted multiple times):
            if (currentTarget.getData("hp") <= 0) return;  // already dead

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

                ctx.data.text = "Increase\nCooldown";
                await engine.eventBus.emit("afterIncCD", ctx);
                await engine.eventBus.emit("ui:negativeText", ctx);
            }
        }
    });
}
