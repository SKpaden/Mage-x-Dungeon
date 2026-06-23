import { dmgTarget } from "../game/combat.js";
import { gameState } from "../game/gameState.js";
import { playDebuffPopup, playPhysicalAttackTween } from "./combatTweens.js";
import { getDefaultElementColor } from "./elementColors.js";
import { showNegativePopup, showPositivePopup } from "./popups.js";
import { updateDebuffDisplay, updateHP, updateTurnMeter } from "./portraitFactory.js";
import { showDmgPopup } from "./skillUI.js";
import { uiStats } from "./uiStats.js";

export function registerCombatUIListeners(engine, scene) {

    engine.eventBus.on("ui:attack", ctx => {
        // Play attack animation BEFORE damage is applied:
        playPhysicalAttackTween(scene, ctx.source, ctx.target.x, ctx.target.y);  // Tween on original target, not current target
    });

    engine.eventBus.on("afterTakeDamage", ctx => {
        // Show damage popup AFTER damage is applied:
        updateHP(ctx.currentTarget, ctx.currentTarget.getData("hp"));
        showDmgPopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, ctx.element ? `-${ctx.modifiedDamage}\n${ctx.element}` : `-${ctx.modifiedDamage}`, {fontSize: uiStats.dmgPopupFontsize, color: getDefaultElementColor(ctx.element), align: 'center'});
    });

    // Successful Debuff application:
    engine.eventBus.on("afterApplyDebuff", ctx => {
        playDebuffPopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, ctx.debuff.name, uiStats.negativePopupOptions);
        updateDebuffDisplay(ctx.scene, ctx.currentTarget);
    });
    // Debuff blocked:
    engine.eventBus.on("onDebuffBlocked", ctx => {
        showPositivePopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, "Immune");
    });
    // Inc Debuff duration:
    engine.eventBus.on("afterIncDebuffDuration", ctx => {
        updateDebuffDisplay(ctx.scene, ctx.currentTarget);
    });

    engine.eventBus.on("ui:positiveText", ctx => {
        showPositivePopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, ctx.data.text);
    })

    engine.eventBus.on("ui:negativeText", ctx => {
        showNegativePopup(ctx.scene, ctx.currentTarget.x, ctx.currentTarget.y, ctx.data.text);
    })

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