import { gameState } from "../../game/gameState.js";


export function registerDeathPipeline(engine) {
    // Someone got killed from an active attack:
    engine.eventBus.on("onActiveDeath", async ctx => {
        // 1. Trigger event on defender side:
        ctx.death = true;  // fixed for now
        await engine.eventBus.emit("beforeDying", ctx);  // maybe set ctx.death = true to confirm or = false with a "prevent death" passive

        // 2. Trigger event on attacker side:
        if (ctx.death) {
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