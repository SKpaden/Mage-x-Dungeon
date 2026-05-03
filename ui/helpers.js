import { uiStats } from "./uiStats.js";
import { gameState } from "../game/gameState.js";
import { getStageReward } from "../managers/stageManager.js";
import { getRegistryData } from "../data/registryData.js";
import { getHeroWithID } from "../data/characters.js";
import { loadImage } from "../managers/assetManager.js";
import { showTextPopup } from "./popups.js";

// Integrates a delay into programm flow.
export function delay(scene, ms) {
    return new Promise(resolve => scene.time.delayedCall(ms, resolve));
}

// Displays the bg image at correct scale.
export function initBg(scene, imageKey, tint = null){
    const tempBg = scene.make.image({
            key: imageKey,
            x: 0,
            y:0,
            add: false
        });

    // Background:
    const bgWidth = tempBg.displayWidth;
    const coverRatio = scene.scale.width/bgWidth;  // how to cover whole screen?
    tempBg.destroy();
    const bg = scene.add.image(scene.scale.width/2, scene.scale.height/2, imageKey).setScale(coverRatio);
    return tint ? bg.setTint(tint) : bg;
}
// Adds texts to the scene.
export function initMessage(scene){
    return scene.add.text(scene.scale.width/2, scene.scale.height *0.5, 'Choose a skill!', { fontSize: '32px', color: '#ffffff'}).setOrigin(0.5);
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

/**
 * Resizes the end screen after battle if it exists.
 * @param {Phaser.scene} scene The current Phaser scene object
 */
export function resizeEndScreen(scene){
    const endScreenContainer = scene.endOverlay;
    if (endScreenContainer){
        // Center again:
        endScreenContainer.x = uiStats.sceneHalfW;
        endScreenContainer.y = uiStats.sceneHalfH;

        // Generous overlay size:
        const darkenRect = endScreenContainer.darkenRect;
        darkenRect.displayWidth = scene.scale.width * 2;
        darkenRect.displayHeight = scene.scale.height * 2;

        // Portrait:
        const portrait = endScreenContainer.portrait;
        if (portrait){
            portrait.setScale(uiStats.portraitScale + 0.2);
        }
        // Main text:
        const title = endScreenContainer.resultText;
        resizeTextElement(title, 0, uiStats.endTitleYOffset, uiStats.endTitleFontSize);
        const subText = endScreenContainer.subText;
        resizeTextElement(subText, 0, uiStats.endSubtextYOffset, uiStats.endSubTextFontSize);
        // Buttons:
        const restartBtn = endScreenContainer.restartBtn;
        resizeRectangleElement(restartBtn, -uiStats.endButtonWidth, uiStats.endButtonYOffset, uiStats.endButtonWidth, uiStats.endButtonHeight);
        const mapBtn = endScreenContainer.mapBtn;
        resizeRectangleElement(mapBtn, uiStats.endButtonWidth, uiStats.endButtonYOffset, uiStats.endButtonWidth, uiStats.endButtonHeight);
        // Button texts:
        const restartText = endScreenContainer.restartText;
        resizeTextElement(restartText, -uiStats.endButtonWidth, uiStats.endButtonYOffset, uiStats.endButtonFontSize);
        const mapText = endScreenContainer.mapText;
        resizeTextElement(mapText, uiStats.endButtonWidth, uiStats.endButtonYOffset, uiStats.endButtonFontSize);
    }
}

/**
 * Resizes a Phaser rectangle element.
 * @param {Object} element The Phaser rectangle game object
 * @param {float} newX The new x pos
 * @param {float} newY The new y pos
 * @param {float} newWidth The new width
 * @param {float} newHeight The new height
 */
export function resizeRectangleElement(element, newX, newY, newWidth, newHeight){
    element.x = newX;
    element.y = newY;
    element.displayWidth = newWidth;
    element.displayHeight = newHeight;
}

/**
 * Resizes a Phaser text element.
 * @param {Object} element The Phaser game text object to resize
 * @param {float} newX The new x position
 * @param {float} newY The new y position
 * @param {int} newFontSize The new font size
 */
export function resizeTextElement(element, newX, newY, newFontSize){
    element.x = newX;
    element.y = newY;
    element.setFontSize(newFontSize);
}

/**
 * Sets a Phaser button object (rectangle) interactive with basic functionality for hover, active, and click.
 * @param {Object} button The Phaser rectangle "button" object
 * @param {int} baseColor Base color
 * @param {int} hoverColor On hover color
 * @param {int} activeColor Active color
 * @param {Function} callback Callback function on "pointerup"
 */
export function setButtonInteractive(button, baseColor, hoverColor, activeColor, callback){
    button
        .on('pointerup', callback)
        .on('pointerdown', () => {
            button.setFillStyle(activeColor);
        })
        .on('pointerover', () => {
            button.setFillStyle(hoverColor);
        })
        .on('pointerout', () => {
            button.setFillStyle(baseColor);
        });
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
    const overlay = scene.add.container(uiStats.sceneHalfW, uiStats.sceneHalfH).setDepth(1000);
    // overlay.setSize(scene.scale.width, scene.scale.height);

    // Darken background (semi-transparent black rect) ==> render above everything else that is supposed to be tinted:
    const darkenRect = scene.add.rectangle(0, 0, scene.scale.width * 2, scene.scale.height * 2, 0x000000, 0.75)
        .setOrigin(0.5);
    overlay.add(darkenRect);

    // Display stage rewards:
    let subTextContent;
    let showRewardHero = false;
    if (winner === 'player'){
        const stage = getRegistryData(scene, 'selectedStage');
        const {shards, heroID} = getStageReward(stage);
        const hero = getHeroWithID(heroID);
        const account = getRegistryData(scene, 'account');

        if (account.eligibleForHeroReward(stage)) {  // full reward
            account.grantStageRewards(stage, shards, heroID);
            subTextContent = `${hero.name} was added to your collection.\n${shards} shards added to your account.`;
            showRewardHero = true;
        }
        else { // add only shards to account
            account.addShards(shards);
            subTextContent = `${shards} shards added to your account.`;
        }

        if (showRewardHero){
            const portrait = hero.portrait;
            const portraitPath = hero.getPortraitPath();
            loadImage(scene, portrait, portraitPath, () => {
                const rewardPortrait = scene.add.image(0, 20, portrait).setScale(uiStats.portraitScale + 0.5);
                scene.tweens.add({
                    targets: rewardPortrait,
                    scale: '-=0.3',
                    ease: 'Back.easeOut',  // looks best imo
                    duration: 200,
                    delay: 500,
                    onStart: () => scene.children.bringToTop(rewardPortrait),  // render above everything else
                    onComplete: () => {
                        scene.cameras.main.shake(200, 0.01);
                    },
                }) 
                overlay.add(rewardPortrait);
                overlay.portrait = rewardPortrait;
            });
        }
    } else {  // Loss => no rewards:
        subTextContent = 'Try again...';
    }

    // Result text (big, centered):
    const resultText = scene.add.text(0, uiStats.endTitleYOffset, winner === 'player' ? 'VICTORY!' : 'DEFEAT!', {
        fontSize: uiStats.endTitleFontSize,
        fontFamily: 'Arial Black',
        color: winner === 'player' ? '#00ff88' : '#ff4444',
        stroke: '#000000',
        strokeThickness: 8
    }).setOrigin(0.5);
    overlay.add(resultText);

    // Subtext:
    const subText = scene.add.text(0, uiStats.endSubtextYOffset, subTextContent, {
        fontSize: uiStats.endSubTextFontSize,
        color: '#ffffff',
        align: 'center'
    }).setOrigin(0.5);
    overlay.add(subText);

    // Restart button:
    const restartBtn = scene.add.rectangle(-uiStats.endButtonWidth, uiStats.endButtonYOffset, uiStats.endButtonWidth, uiStats.endButtonHeight, uiStats.endBtnBaseColor).setInteractive({ useHandCursor: true });
    const restartText = scene.add.text(-uiStats.endButtonWidth, uiStats.endButtonYOffset, 'Restart Battle', {
        fontSize: uiStats.endButtonFontSize,
        color: '#ffffff'
    }).setOrigin(0.5);
    overlay.add([restartBtn, restartText]);

    // Map button (placeholder for later):
    const mapBtn = scene.add.rectangle(uiStats.endButtonWidth, uiStats.endButtonYOffset, uiStats.endButtonWidth, uiStats.endButtonHeight, uiStats.endBtnBaseColor).setInteractive({ useHandCursor: true });
    const mapText = scene.add.text(uiStats.endButtonWidth, uiStats.endButtonYOffset, 'Stage Selection', {
        fontSize: uiStats.endButtonFontSize,
        color: '#ffffff'
    }).setOrigin(0.5);
    overlay.add([mapBtn, mapText]);

    // Button interactions:
    setButtonInteractive(restartBtn,
                         uiStats.endBtnBaseColor,
                         uiStats.endBtnHoverColor,
                         uiStats.endBtnActiveColor,
                         () => {
                            overlay.destroy();
                            scene.scene.restart();  // restart this battle scene
                        });

    setButtonInteractive(mapBtn,
                         uiStats.endBtnBaseColor,
                         uiStats.endBtnHoverColor,
                         uiStats.endBtnActiveColor,
                         () => {
                            overlay.destroy();
                            scene.scene.start('map');  // switch to menu scene
                        });
   
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
    // Store references for resize:
    overlay.darkenRect = darkenRect;
    overlay.resultText = resultText;
    overlay.subText = subText;
    overlay.restartBtn = restartBtn;
    overlay.mapBtn = mapBtn;
    overlay.restartText = restartText;
    overlay.mapText = mapText;

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