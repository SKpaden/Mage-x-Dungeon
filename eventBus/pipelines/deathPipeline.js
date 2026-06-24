import { gameState, successfulRevival } from "../../game/gameState.js";


export function registerDeathPipeline(engine) {

    engine.eventBus.on("afterRevive", ctx => {
        successfulRevival(ctx.currentTarget);
    });

    engine.eventBus.on("intent:revive", async ctx => {
        const affectedTargets = ctx.affectedTargets;
        for (let i = 0; i < affectedTargets.length; i++){
            const currentTarget = affectedTargets[i];
            
            ctx.currentTarget = currentTarget;
            ctx.data.modifiedHp = ctx.data.hp;
            ctx.data.modifiedTM = ctx.data.tm;
            ctx.flags.blocked = false;  

            if (currentTarget.getData("hp") > 0) continue;  // not dead ==> skip

            await engine.eventBus.emit("beforeRevive", ctx);  // potentially mutates ctx with flags and data (modifiedHp/TM)

            if (!ctx.flags.blocked){  // no Passive denied revival
                const char = currentTarget.getData("char");
                const newHp = Math.floor(ctx.data.modifiedHp * char.statManager.getBaseStat('hp'));
                const newTm = Math.floor(ctx.data.modifiedTM * gameState.combinedSpeed);
                // Update data:
                currentTarget.setData('hp', newHp);
                currentTarget.setData('turnMeter', newTm);
                
                await engine.eventBus.emit("afterRevive", ctx);  // for effects after revive (place buff after revive or boost TM on revive)
                ctx.data.text = "Revive";
                await engine.eventBus.emit("ui:revive", ctx);  // potentially mutates ctx with flags and data (modifiedHp/TM)
            } else {
                await engine.eventBus.emit("onReviveBlocked", ctx);
                ctx.data.text = "Revive\nBlocked";
                await engine.eventBus.emit("ui:negativeText", ctx);
            }
        }
    });

    // Someone got killed from an active attack:
    engine.eventBus.on("onActiveDeath", async ctx => {
        // 1. Trigger event on defender side:
        ctx.flags.death = true;  // fixed for now
        await engine.eventBus.emit("beforeDying", ctx);  // maybe set ctx.flags.death = true to confirm or = false with a "prevent death" passive

        // 2. Trigger event on attacker side:
        if (ctx.flags.death) {
            const team = ctx.currentTarget.getData('team');
            team === 'player' ? gameState.playerAlive-=1 : gameState.enemyAlive-=1;
            ctx.currentTarget.setData("debuffs", []);  // reset debuffs
            // ctx.currentTarget.setData("buffs", []);  // much later maybe
            ctx.currentTarget.setData("turnMeter", 0);
            await engine.eventBus.emit("afterKill", ctx);  // activate passives (extra turns, attack other enemies...)

            // 3. Trigger UI changes:
            await engine.eventBus.emit("afterDeath", ctx);
        }
    });
}