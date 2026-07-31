import { StatManager } from "../../data/statManager.js";
import { Debuff } from "../../game/debuffs.js";
import { gameState } from "../../game/gameState.js";
import { setLogTarget } from "../../ui/combatLog.js";
import { delay } from "../../ui/helpers.js";
import { uiStats } from "../../ui/uiStats.js";

export function registerDebuffPipeline(engine) {

    engine.eventBus.on("afterApplyDebuff", ctx => {
        if (!gameState.logQueue[ctx.logQueueKey].debuffsApplied) gameState.logQueue[ctx.logQueueKey].debuffsApplied = 0;
        gameState.logQueue[ctx.logQueueKey].debuffsApplied++;
    });

    // 1. Entry point: a SkillPart emitted an intent:
    engine.eventBus.on("intent:activatePoison", async ctx => {
        const affectedTargets = ctx.affectedTargets;

        for (let i = 0; i < affectedTargets.length; i++){
            const currentTarget = affectedTargets[i];
            if (currentTarget.getData("hp") <= 0) continue;

            ctx.currentTarget = currentTarget;

            const debuffs = currentTarget.getData('debuffs');
            // Count poisons:
            let poisonCount = 0;
            let dmgCount = 0;
            const newDebuffs = debuffs.filter(debuff => {
                if (debuff.name === 'Poison'){
                    poisonCount += debuff.duration;
                    dmgCount += debuff.getTickDmg(currentTarget) * debuff.duration;
                    return false;
                } return true;
            });

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

        const debuff = ctx.data.debuff;   // the Debuff to apply
        const source = ctx.source;

        const affectedTargets = ctx.affectedTargets;

        if (ctx.flags.popupDelay){
            await delay(ctx.scene, ctx.data.delay);
        }

        for (let i = 0; i < affectedTargets.length; i++){
            // const currentIndex = affectedTargets[i];
            const currentTarget = affectedTargets[i];
            if (currentTarget.getData("hp") <= 0) continue;  // skip if target died from damage

            ctx.currentTarget = currentTarget;
            ctx.flags.blocked = false;

            // 1. Pre-event:
            await engine.eventBus.emit("beforeApplyDebuff", ctx);  // potentially mutates ctx with flags
    
            // 2. Apply debuff, if allowed:
            if (!ctx.flags.blocked){
                const debuffs = currentTarget.getData('debuffs') || [];
                if (Debuff.allowDebuff(debuffs, debuff.name)){
                    debuffs.push(debuff.createCopy(source));
                    currentTarget.setData('debuffs', debuffs);
                    // 3. Post-event:
                    await engine.eventBus.emit("afterApplyDebuff", ctx);
                }
        
            } else {
                await engine.eventBus.emit("onDebuffBlocked", ctx);  // for UI and perhaps passives
                ctx.data.text = debuff.name + "\nBlocked";
                await engine.eventBus.emit("ui:positiveText", ctx);
            }
        }
    });

    engine.eventBus.on("intent:fullCleanse", async ctx => {
        const affectedTargets = ctx.affectedTargets;
        for (let i = 0; i < affectedTargets.length; i++){
            const currentTarget = affectedTargets[i];
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
            const currentTarget = affectedTargets[i];
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

    // Tick debuffs on target (called at start of a unit's turn).
    engine.eventBus.on("intent:tickDebuffs", async ctx => {
        const currentTarget = ctx.target;
        if (currentTarget.getData("hp") <= 0) return;

        ctx.currentTarget = currentTarget;
        let skipTurn = null;

        const debuffs = currentTarget.getData('debuffs') || [];

        // Execute ticks and filter expired debuffs:
        const newDebuffs = [];
        for (const deb of debuffs){
            ctx.source = deb.source;
            if (deb.skip()) skipTurn = deb.name;
            
            // { keep: this.duration > 0, baseTickDmg: dmg, debuff: this, skipTurn: this.skipTurn }
            const results = await deb.tick(ctx.scene, currentTarget, ctx);

            if (results.keep) newDebuffs.push(deb);
            ctx.data.tickDmg = results.baseTickDmg;
            ctx.data.modifiedTickDmg = ctx.data.tickDmg;
            await engine.eventBus.emit("onBeforeTickDebuff", ctx);

            // Popup:
            ctx.data.text = ctx.data.tickDmg ? `-${ctx.data.modifiedTickDmg}\n${deb.name}` : deb.name;
            await engine.eventBus.emit("ui:negativeText", ctx);
            await delay(ctx.scene, uiStats.debuffDelay);

            if (results.chosenTarget){
                const char = currentTarget.getData('char');
                try{
                    setLogTarget(deb.name);
                    // Use the unit's basic skill:
                    await delay(ctx.scene, uiStats.controlDelay);
                    await char.skills[0].apply(ctx.scene, ctx.target, results.chosenTarget, results.chosenTarget.getData('teamIndex'), ctx.allies, ctx.allies);
                    await delay(ctx.scene, uiStats.controlDelay);
                } catch (e){
                    console.error('ControlDebuff forced action failed', e);
                }
            }            


            // Apply final damage:
            // const hp = StatManager.getContainerStat(currentTarget, 'hp');
            const hp = currentTarget.getData('hp');
            const newHp = Math.max(0, hp - ctx.data.modifiedTickDmg);
            StatManager.getContainerStat(currentTarget, 'hp', newHp);
            currentTarget.setData('hp', newHp);


            // Passives hook into this post-event:
            await engine.eventBus.emit("onAfterTickDebuff", ctx);
    
            // Notify listeners:
            await engine.eventBus.emit("afterTakeDamage", ctx);  // triggers Reactions
    
            // Death check:
            if (newHp <= 0) {
                await engine.eventBus.emit("onActiveDeath", ctx);
                ctx.flags.skipTurn = 'Death';
                return;
            }
        }

        currentTarget.setData("debuffs", newDebuffs);
        // Update UI:
        await engine.eventBus.emit("ui:debuffUpdate", ctx);
        await engine.eventBus.emit("ui:hpUpdate", ctx);

        // Attach skipTurn result:
        if (skipTurn) ctx.flags.skipTurn = skipTurn;
    });
}