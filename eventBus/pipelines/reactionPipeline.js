import { gameState } from "../../game/gameState.js";
import { Reaction } from "../../game/reactions.js";
import { delay } from "../../ui/helpers.js";
import { uiStats } from "../../ui/uiStats.js";

export function registerReactionPipeline(engine) {

    engine.eventBus.on("afterTakeDamage", async ctx => {
        if (!ctx.data.element) return;  // no element = no Reaction

        const target = ctx.currentTarget;
        const debuffs = target.getData("debuffs") || [];
        let allowElementalDebuff = true;
        let finalDmg = ctx.data.modifiedDamage;

        const debuffFilter = {};
        for (const debuff of debuffs) {
            debuffFilter[debuff.name] = true;

            if (debuff.type === "elemental") {
                const duration = debuff.duration;
                // TODO: Change the finalDmg calculation here ==> Reaction should have better uniquely calculated damage numbers (based on duration)

                const triggeredReaction = Reaction.getTriggeredReaction(debuff, ctx.data.element, finalDmg * duration);
                if (triggeredReaction) {
                    debuffFilter[debuff.name] = false;
                    allowElementalDebuff = false;
                    gameState.reactionQueue.push(Reaction.getQueueEntry(triggeredReaction, target, ctx.enemies));
                    gameState.logQueue[ctx.logQueueKey].reactionsTriggered = (gameState.logQueue[ctx.logQueueKey].reactionsTriggered || 0) + 1;
                }
            }
        }

        const newDebuffs = debuffs.filter((debuff) => debuffFilter[debuff.name]);
        target.setData("debuffs", newDebuffs);

        if (allowElementalDebuff) {
            if (!ctx.data.nextTargets) ctx.data.nextTargets = [];
            ctx.data.nextTargets.push(target);
            ctx.flags.allowElementalDebuff = true;
        } else {
            ctx.flags.allowElementalDebuff = false;
        }

        await engine.eventBus.emit("ui:debuffUpdate", ctx);
    });

    engine.eventBus.on("intent:processReactions", async ctx => {
        if (!gameState.reactionQueue.length) return;

        for (const reactionEntry of gameState.reactionQueue) {
            await delay(ctx.scene, uiStats.reactionDelay);
            const reaction = reactionEntry.reaction;
            if (!gameState.logQueue[reaction.name]) gameState.logQueue[reaction.name] = { 'targets': [], 'dmg': []};  // add reaction to log queue

            const affectedTargets = reactionEntry.targets;
            ctx.affectedTargets = affectedTargets;
            ctx.data.color = reactionEntry.reaction.color;
            ctx.data.dmg = reactionEntry.reaction.dmg;
            ctx.data.element = null;
            ctx.data.reaction = reactionEntry.reaction;

            await engine.eventBus.emit("intent:dealReactionDamage", ctx);
        }

        gameState.reactionQueue = [];
    });
}
