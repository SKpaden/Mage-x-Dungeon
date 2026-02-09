import { uiStats } from "./uiStats.js";
import { gameState } from "../game/gameState.js";

// Integrates a delay into programm flow.
export function delay(scene, ms) {
    return new Promise(resolve => scene.time.delayedCall(ms, resolve));
}

// Displays the bg image at correct scale.
export function initBg(scene){
    const tempBg = scene.make.image({
            key: 'battlefield',
            x: 0,
            y:0,
            add: false
        });

        // Background:
        const bgWidth = tempBg.displayWidth;
        const coverRatio = scene.scale.width/bgWidth;  // how to cover whole screen?
        tempBg.destroy();
        return scene.add.image(scene.scale.width/2, scene.scale.height/2, 'battlefield').setScale(coverRatio).setTint(0x202020);
}
// Adds texts to the scene.
export function initMessage(scene){
    return scene.add.text(scene.scale.width/2, scene.scale.height *0.5, 'Choose a skill!', { fontSize: '32px', color: '#ffffff'}).setOrigin(0.5);
}

// Writes portrait dimensions to uiStats.
export function initPortraitDims(scene){
    const tempPortrait = scene.make.image({
            x: 0,
            y: 0,
            key: 'my-hero',
            scale: uiStats.portraitScale,
            add: false  // <- crucial: do NOT add to scene
        });

        const portraitWidth = tempPortrait.displayWidth;
        const portraitHeight = tempPortrait.displayHeight;

        // No need to destroy, it was never added...
        const halfW = portraitWidth / 2;
        const halfH = portraitHeight / 2;

        uiStats.portraitWidth = portraitWidth;
        uiStats.portraitHeight = portraitHeight;
        uiStats.halfW = halfW;
        uiStats.halfH = halfH;
}

// Inits the turn text indicating whose turn it is.
export function initTurnText(scene){
    return scene.add.text(scene.scale.width*0.85 + uiStats.margin,
                          scene.scale.height/2, 'Player Turn', { fontSize: '36px', color: '#00ff00' }).setOrigin(0.5);
}

// Highlights a portrait as selected or removes the highlight.
export function setHighlight(container, enable) {
    const graphics = container.getData('borderGraphics');
    const halfW = container.getData('halfW');
    const halfH = container.getData('halfH');
    const portraitWidth = container.getData('displayWidth');
    const portraitHeight = container.getData('displayHeight');
    graphics.clear();
    if (enable) { // no recursive call ==> triggered from a click
        if(gameState.selectedPlayer && gameState.selectedPlayer === container){  // same container twice in a row
            graphics.lineStyle(2, 0xFFE836, 1);  // base border
            graphics.strokeRoundedRect(-halfW, -halfH, portraitWidth, portraitHeight, 5);
            gameState.selectedPlayer = null;  // reset
            return;  // break
        }
    }
    graphics.lineStyle(enable ? 6 : 2, enable ? 0xffffff : 0xFFE836, 1);
    graphics.strokeRoundedRect(-halfW, -halfH, portraitWidth, portraitHeight, 5);  // redraw
    if (enable){
        if(gameState.selectedPlayer) {
            setHighlight(gameState.selectedPlayer, false);  // remove old selected
        }
        gameState.selectedPlayer = container;  // update selected
    }
}

// Shows computer's selected target.
export function setPlayerTarget(scene, target){  // clear is already done by clearSelections()
    if(gameState.turn !== 'enemy') return;
    // Else:
    const graphics = target.getData('borderGraphics');
    const halfW = target.getData('halfW');
    const halfH = target.getData('halfH');
    const portraitWidth = target.getData('displayWidth');
    const portraitHeight = target.getData('displayHeight');
    graphics.clear();

    graphics.lineStyle(6, 0xff0000, 1);
    graphics.strokeRoundedRect(-halfW, -halfH, portraitWidth, portraitHeight, 5);
    gameState.selectedPlayer = target;
}

// Updates text and color of text object.
export function updateText(object, newText, color){
    object.setText(newText);
    object.setColor(color);
}