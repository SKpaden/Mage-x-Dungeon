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
    console.log(portraitHeight/scene.scale.height);
}

// Writes portrait dimensions to uiStats.
export function initPortraitDimsWithScaleManager(scene){
    var tempPortrait = scene.make.image({
        x: 0,
        y: 0,
        key: 'Draconoid - Dark Mage.jpg',
        //scale: uiStats.portraitScale,
        scale: 1,
        add: false  // <- crucial: do NOT add to scene
    });

    var portraitWidth = tempPortrait.displayWidth;
    var portraitHeight = tempPortrait.displayHeight;

    const heightAllowed = scene.scale.height / 3;  // use *0.4 for old display size
    const scale = heightAllowed / portraitHeight;
    // Remake with correct scale and get dimensions:
    tempPortrait = scene.make.image({
        x: 0,
        y: 0,
        key: 'Draconoid - Dark Mage.jpg',
        //scale: uiStats.portraitScale,
        scale: scale,
        add: false  // <- crucial: do NOT add to scene
    });

    portraitWidth = tempPortrait.displayWidth;
    portraitHeight = tempPortrait.displayHeight;

    // No need to destroy, it was never added...
    const halfW = portraitWidth / 2;
    const halfH = portraitHeight / 2;


    uiStats.portraitScale = scale;
    uiStats.portraitWidth = portraitWidth;
    uiStats.portraitHeight = portraitHeight;
    uiStats.halfW = halfW;
    uiStats.halfH = halfH;

    initSkillIconDims(scene, portraitWidth);
}

// Inits the turn text indicating whose turn it is.
export function initTurnText(scene){
    return scene.add.text(scene.scale.width*0.85 + uiStats.margin,
                          scene.scale.height/2, 'Player Turn', { fontSize: '36px', color: '#00ff00' }).setOrigin(0.5);
}

// Removes the highlight border from a player container.
export function removeHighlight(container){
    const {graphics, dimensions} = getContainerHighlightData(container);  // clear graphics and get data
    redrawBorder(graphics, uiStats.portraitBorderWidth, uiStats.portraitDefaultBorderColor, dimensions, uiStats.borderRadius);
    gameState.selectedPlayer = null;
}

// Highlights a portrait as selected or removes the highlight.
export function setHighlight(container) {
    const {graphics, dimensions} = getContainerHighlightData(container);  // clear graphics and get data
    redrawBorder(graphics, uiStats.portraitHighlightBorderWidth, uiStats.portraitHighlightBorderColor, dimensions, uiStats.borderRadius);
    gameState.selectedPlayer = container;
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

    graphics.lineStyle(uiStats.portraitHighlightBorderWidth, uiStats.enemyPlayerTargetColor, 1);
    graphics.strokeRoundedRect(-halfW, -halfH, portraitWidth, portraitHeight, uiStats.borderRadius);
    gameState.selectedPlayer = target;
}

// Shows the end screen after a battle is over.
export function showEndScreen(scene, winner){
    // Create full-screen overlay:
    const overlay = scene.add.container(scene.scale.width/2, scene.scale.height/2).setDepth(1000);
    overlay.setSize(scene.scale.width, scene.scale.height);

    // Darken background (semi-transparent black rect) ==> render above everything else that is supposed to be tinted:
    const darkenRect = scene.add.rectangle(0, 0, scene.scale.width * 2, scene.scale.height * 2, 0x000000, 0.75)
        .setOrigin(0.5);
    overlay.add(darkenRect);

    // Result text (big, centered):
    const resultText = scene.add.text(0, -100, winner === 'player' ? 'VICTORY!' : 'DEFEAT!', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: winner === 'player' ? '#00ff88' : '#ff4444',
        stroke: '#000000',
        strokeThickness: 8
    }).setOrigin(0.5);
    overlay.add(resultText);

    // Subtext:
    const subText = scene.add.text(0, -20, winner === 'player' ? 'Enemies defeated!' : 'Try again...', {
        fontSize: '28px',
        color: '#ffffff'
    }).setOrigin(0.5);
    overlay.add(subText);

    // Restart button:
    const restartBtn = scene.add.rectangle(-120, 80, 220, 70, 0x4a7c59).setInteractive({ useHandCursor: true });
    const restartText = scene.add.text(-120, 80, 'Restart Battle', {
        fontSize: '24px',
        color: '#ffffff'
    }).setOrigin(0.5);
    overlay.add([restartBtn, restartText]);

    // Main Menu button (placeholder for later):
    const menuBtn = scene.add.rectangle(120, 80, 220, 70, 0x4a7c59).setInteractive({ useHandCursor: true });
    const menuText = scene.add.text(120, 80, 'Main Menu', {
        fontSize: '24px',
        color: '#ffffff'
    }).setOrigin(0.5);
    overlay.add([menuBtn, menuText]);

    // Button interactions:
    restartBtn.on('pointerdown', () => {
        overlay.destroy();
        scene.scene.restart();  // restart this battle scene
        // scene.scene.start('battle');
    });

    menuBtn.on('pointerdown', () => {
        overlay.destroy();
        scene.scene.start('main_menu');  // switch to menu scene
    });

    // // ESC to restart (fallback):
    // scene.input.keyboard.once('keydown-ESC', () => {
    //     overlay.destroy();
    //     scene.scene.restart();
    // });

    // Fade-in animation:
    overlay.setAlpha(0);
    scene.tweens.add({
        targets: overlay,
        alpha: 1,
        duration: 600,
        ease: 'Power2'
    });

    // Make overlay capture all input (disable underlying game):
    overlay.setInteractive(new Phaser.Geom.Rectangle(-scene.scale.width, -scene.scale.height, scene.scale.width * 2, scene.scale.height * 2), Phaser.Geom.Rectangle.Contains);

    // Responsive: reposition on resize:
    scene.scale.on('resize', () => {
        overlay.x = scene.scale.width / 2;
        overlay.y = scene.scale.height / 2;
    });

    // Store for cleanup:
    scene.endOverlay = overlay;
}

// Updates text and color of text object.
export function updateText(object, newText, color){
    object.setText(newText);
    object.setColor(color);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

// Clears graphics and returns all needed data to redraw border.
function getContainerHighlightData(container){
    const graphics = container.getData('borderGraphics');
    const halfW = container.getData('halfW');
    const halfH = container.getData('halfH');
    const portraitWidth = container.getData('displayWidth');
    const portraitHeight = container.getData('displayHeight');
    graphics.clear();  // remove old border

    return {graphics: graphics,
            dimensions: {
                halfW: halfW,
                halfH: halfH,
                portraitWidth: portraitWidth,
                portraitHeight: portraitHeight,
            }
    };
}

// Redraws the border of a container.
function redrawBorder(graphics, borderWidth, borderColor, dims, borderRadius){
    graphics.lineStyle(borderWidth, borderColor, 1);
    graphics.strokeRoundedRect(-dims.halfW, -dims.halfH, dims.portraitWidth, dims.portraitHeight, borderRadius);  // redraw
}

// Inits skill icon dimensions based on size of canvas.
function initSkillIconDims(scene, portraitWidth){
    const spaceAvailabe = portraitWidth - 4*uiStats.paddingHpBar - 3*uiStats.skillIconMargin;  // padding on each side (twice because of border as well), 4 skills max ==> 3 gaps
    const iconWidth = spaceAvailabe / 4;
    const ratio = iconWidth / uiStats.iconBaseDims;

    // Update in uiStats:
    uiStats.skillIconScale = ratio;
    uiStats.skillIconDims = iconWidth;
}