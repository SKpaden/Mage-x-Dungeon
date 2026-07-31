import { dmgTarget } from "../game/combat.js";
import { gameState } from "../game/gameState.js";
import { playDebuffPopup, playPhysicalAttackTween } from "./combatTweens.js";
import { getDefaultElementColor } from "./elementColors.js";
import { showNegativePopup, showPositivePopup } from "./popups.js";
import { updateDebuffDisplay, updateHP, updateTurnMeter } from "./portraitFactory.js";
import { showDmgPopup } from "./skillUI.js";
import { uiStats } from "./uiStats.js";

export function registerCombatUIListeners(engine, scene) {

    engine.eventBus.on("afterTakeDamage", ctx => {
        const color = ctx.data.element ? getDefaultElementColor(ctx.data.element) : ctx.data.color;
        const text = ctx.data.text ? ctx.data.text : `-${ctx.data.modifiedDamage}\n${ctx.data.element}`;
        // Show damage popup AFTER damage is applied:
        updateHP(ctx.currentTarget, ctx.currentTarget.getData("hp"));
        showDmgPopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, text, {fontSize: uiStats.dmgPopupFontsize, color: color, align: 'center'});
    });

    // Successful Debuff application:
    engine.eventBus.on("afterApplyDebuff", ctx => {
        playDebuffPopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, ctx.data.debuff.name, uiStats.negativePopupOptions);
        updateDebuffDisplay(ctx.scene, ctx.currentTarget);
    });

    engine.eventBus.on("ui:attack", ctx => {
        // Play attack animation BEFORE damage is applied:
        playPhysicalAttackTween(scene, ctx.source, ctx.target.x, ctx.target.y);  // Tween on original target, not current target
    });

    engine.eventBus.on("ui:debuffUpdate", ctx => {
        updateDebuffDisplay(ctx.scene, ctx.currentTarget);
    });

    engine.eventBus.on("ui:hpUpdate", ctx => {
        updateHP(ctx.currentTarget, ctx.currentTarget.getData("hp"));
    });

    engine.eventBus.on("ui:negativeText", ctx => {
        showNegativePopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, ctx.data.text);
    });

    engine.eventBus.on("ui:positiveText", ctx => {
        showPositivePopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, ctx.data.text);
    });

    engine.eventBus.on("ui:revive", ctx => {
        updateHP(ctx.currentTarget, ctx.currentTarget.getData("hp"));
        updateTurnMeter(ctx.scene, ctx.currentTarget, ctx.data.modifiedTM);
        showPositivePopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, ctx.data.text);
        ctx.currentTarget.clearAlpha();
    });

    engine.eventBus.on("ui:takeDamage", ctx => {
        const color = ctx.data.element ? getDefaultElementColor(ctx.data.element) : ctx.data.color;
        // Show damage popup AFTER damage is applied:
        updateHP(ctx.currentTarget, ctx.currentTarget.getData("hp"));
        showDmgPopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, ctx.data.text, {fontSize: uiStats.dmgPopupFontsize, color: color, align: 'center'});
    });
    

    // Target died:
    // TODO: Needs to change a bit if a Debuff tick kills target ==> no SkillContext present currently ==> no ctx.currentTarget...
    engine.eventBus.on("afterDeath", ctx => {
        updateDebuffDisplay(ctx.scene, ctx.currentTarget);
        updateTurnMeter(ctx.scene, ctx.currentTarget, 0);
    });

    engine.eventBus.on("afterBoostTM", ctx => {
        const tm = ctx.currentTarget.getData('turnMeter');
        const ratio = Math.min(1, tm/gameState.combinedSpeed);
        updateTurnMeter(ctx.scene, ctx.currentTarget, ratio);
    })

    engine.eventBus.on("afterHeal", ctx => {
        updateHP(ctx.currentTarget, ctx.currentTarget.getData("hp"));
    })
}