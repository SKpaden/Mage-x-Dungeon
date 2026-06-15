import { dmgTarget } from "../game/combat.js";
import { gameState } from "../game/gameState.js";
import { playPhysicalAttackTween } from "./combatTweens.js";
import { getDefaultElementColor } from "./elementColors.js";
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

    engine.eventBus.on("afterApplyDebuff", ctx => {
        updateDebuffDisplay(scene, ctx.currentTarget);
    });

    engine.eventBus.on("onDebuffBlocked", ctx => {
        // showBlockedPopup(scene, ctx.target);
    });

    engine.eventBus.on("afterDeath", ctx => {
        updateDebuffDisplay(ctx.scene, ctx.currentTarget);
        updateTurnMeter(ctx.scene, ctx.currentTarget, 0);
    });
}