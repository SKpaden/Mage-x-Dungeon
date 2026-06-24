import { gameState } from "../../game/gameState.js";


export function registerTMPipeline(engine) {

    engine.eventBus.on("intent:boostTM", async ctx => {

        const amount = ctx.data.amount;
        ctx.data.modifiedAmount = amount;  // for mutating by events

        const affectedTargets = ctx.affectedTargets;

        for (let i = 0; i < ctx.affectedTargets.length; i++){
            const currentTarget = ctx.affectedTargets[i];

            ctx.currentTarget = currentTarget;

            // 1. Pre-event: Increase (ally Passive) or decrease (enemy Passive) modifiedAmount.
            // Problematic with only 1 event because of ordering, but is fine for now.
            await engine.eventBus.emit("beforeBoostTM", ctx);  // potentially mutates modifiedAmount

            let tm = currentTarget.getData('turnMeter');
            tm += Math.floor(gameState.combinedSpeed * ctx.data.modifiedAmount);
            currentTarget.setData('turnMeter', tm);

            await engine.eventBus.emit("afterBoostTM", ctx);

            ctx.data.text = "Boost\nTurn Meter";
            await engine.eventBus.emit("ui:positiveText", ctx);  // UI popup
        }
    });
}