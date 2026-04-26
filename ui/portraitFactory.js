import { gameState } from "../game/gameState.js";
import { applySkill } from "../game/combat.js";
import { clearAffectedAllies, clearAffectedTargets, previewTargets, resizeSkillDisplay } from "./skillUI.js";
import { uiStats } from "./uiStats.js";
import { Debuff } from "../game/debuffs.js";
import { setHighlight } from "./helpers.js";

// Creates enemy portraits with Character class.
export function createEnemyPortraitAlt(scene, x, y, character, scale, team, index){
    const portraitContainer = createCharacterContainerAlt(scene, x, y, character, scale, team, index);
    return portraitContainer;
}

// Creates hero portrait with Character class.
export function createHeroPortraitAlt(scene, x, y, character, scale, team, index){
    const portraitContainer = createCharacterContainerAlt(scene, x, y, character, scale, team, index);     
    return portraitContainer;
}

// Return a reusable tween for portrait clicks.
export function getPortraitTween(scene, container){
    return scene.tweens.add({
                targets: container,
                scale: '+=0.1',
                duration: 150,
                yoyo: true,  // return to starting state
                ease: 'Sine.easeOut',
                paused: true,  // don't play immediately
                persist: true,  // necessary when calling play(), otherwise it gets completed and can't be called again
                onComplete: () => {
                    container.setScale(1);  // force exact reset, safer
                }
            });
}

// Called after window resize. Resizes all character displays to match new window size.
export function resizeAllContainers(scene){
    resizePlayerContainers(scene, gameState.playerContainers);
    resizeEnemyContainers(scene, gameState.enemyContainers);
    // If a skill display exists currently, resize it:
    if (gameState.turn === 'player' && !gameState.pendingSkill && gameState.selectedPlayer) resizeSkillDisplay(scene);
    if (gameState.turn === 'player' && gameState.selectedPlayer) setHighlight(gameState.selectedPlayer);
}

// Updates the debuff display.
export function updateDebuffDisplay(scene, container){
    const debuffContainer = container.getData('debuffContainer');
    debuffContainer.destroy();  // remove old
    displayDebuffs(scene, container, container.getData('halfW'), container.getData('halfH'));  // add new
}

// Updates HP of target container to newHp.
export function updateHP(container, newHp) {
    const hpGraphics = container.getData('hpGraphics');
    const halfW = container.getData('halfW');
    const halfH = container.getData('halfH');
    const displayWidth = container.getData('displayWidth');
    const maxHp = container.getData('maxHp');
    hpGraphics.clear();
    // Redraw grey bg:
    hpGraphics.fillStyle(0xBDB9B9, 1.0);
    hpGraphics.fillRoundedRect(-halfW, halfH + uiStats.marginPortraitHpBar, displayWidth, uiStats.hpBarHeight, uiStats.borderRadius);
    // Redraw red fill:
    if (newHp > 0) {
        hpGraphics.fillStyle(0xDE1616, 1.0);
        const barWidth = (displayWidth - 2*uiStats.paddingHpBar) * (newHp/maxHp);
        hpGraphics.fillRoundedRect(-halfW + uiStats.paddingHpBar, halfH + uiStats.marginPortraitHpBar + uiStats.paddingHpBar, barWidth, uiStats.hpBarHeight - 2*uiStats.paddingHpBar, uiStats.borderRadius);
    } else {
        newHp = 0;
        container.setAlpha(0.4);
    }

    // Update text:
    const hpText = container.getData('hpText');
    hpText.setText(`${newHp}/${maxHp}`);
    container.setData('hp', newHp);
}

// Redraws the turn meter matching the passed value.
export function updateTurnMeter(scene, container, value){
    const tmGraphics = container.getData('tmGraphics');
    tmGraphics.clear();

    tmGraphics.fillStyle(0xBDB9B9, 1.0);
    tmGraphics.fillRoundedRect(-uiStats.halfW, uiStats.halfH + uiStats.hpBarHeight + 2*uiStats.marginPortraitHpBar/3, uiStats.portraitWidth, uiStats.tmHeight, uiStats.borderRadius);
    if (value){
        tmGraphics.fillStyle(0x00FF00, 1.0);
        tmGraphics.fillRoundedRect(-uiStats.halfW + uiStats.paddingHpBar, uiStats.halfH + uiStats.hpBarHeight + 2*uiStats.marginPortraitHpBar/3 + uiStats.paddingHpBar, (uiStats.portraitWidth - 2*uiStats.paddingHpBar)*value, uiStats.tmHeight - 2*uiStats.paddingHpBar, uiStats.borderRadius);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

// Adds each object within the objects array to the container.
function addToContainer(container, objects){
    objects.forEach(element => {
        container.add(element);
    });
}

// Creates a border graphics object and returns it.
function createBorderGraphics(scene, x, y, width, height, borderRadius, color){
    const borderGraphics = scene.add.graphics();
    borderGraphics.lineStyle(uiStats.portraitBorderWidth, color, 1);

    borderGraphics.strokeRoundedRect(x, y, width, height, borderRadius);
    return borderGraphics;
}

function createCharacterContainerAlt(scene, x, y, character, scale, team, index){
const imgKey = character.portrait;
    if(!scene.textures.exists(imgKey)){
        console.warn(`Failed to load ${imgKey}!`);
    }
    const portrait = scene.add.image(0, 0, imgKey).setScale(scale);
    const halfW = portrait.displayWidth/2;
    const halfH = portrait.displayHeight/2;

    var borderGraphics = createBorderGraphics(scene, -halfW, -halfH, portrait.displayWidth, portrait.displayHeight, uiStats.borderRadius, 0xFFE836);
    
    // HP BARS:
    var hpGraphics = createHpGraphics(scene, -halfW, halfH + uiStats.marginPortraitHpBar, portrait.displayWidth,
                                        uiStats.hpBarHeight, uiStats.borderRadius, 0xBDB9B9, 0xDE1616, 1);

    const hpTextYPos = halfH + uiStats.marginPortraitHpBar + (uiStats.hpBarHeight-2*uiStats.paddingHpBar)/2 + uiStats.paddingHpBar;
    // y = halfH + uiStats.marginPortraitHpBar + redbarHeight/2 + uiStats.paddingHpBar = halfH + 5 + 12 + 3 = halfH + 20
    const hpText = createHpText(scene, 0, hpTextYPos, `${character.maxHp}/${character.maxHp}`, {fontSize: '14px', color: '#000000', fontFamily: 'Arial'});
    
    const portraitContainer = scene.add.container(x, y);  // previous portrait location

    // Add all children to the container (order matters!):
    addToContainer(portraitContainer, [portrait, borderGraphics, hpGraphics, hpText]);  // order matters!

    // Make the container interactive:
    setContainerInteractive(scene, portraitContainer, portrait,
                            {
                                hitArea: new Phaser.Geom.Rectangle(-halfW, -halfH, portrait.displayWidth,portrait.displayHeight),
                                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                                useHandCursor: true
                            //}, 0x820000);
                            }, team);
    

    // Store data in container:
    setContainerData(portraitContainer, {
        'char': character,
        'name': character.name,
        'halfW': halfW,
        'halfH': halfH,
        'displayWidth': portrait.displayWidth,
        'displayHeight': portrait.displayHeight,
        'hpGraphics': hpGraphics,
        'borderGraphics': borderGraphics,
        'hpText': hpText,
        'hp': character.maxHp,
        'maxHp': character.hp,
        'speed': character.speed,
        'skills': character.skills,
        // 'debuffs': [new Debuff('Wet', 3, 0, 'Water'), new Debuff('Shock', 2, 10, 'Electro')],
        // 'debuffs': [new Debuff('Shock', 3, 10, 'Electro')],
        'debuffs': [],
        'buffs': [],
        'team': team,
        'teamIndex': index,
        'turnMeter': 0,
        'turnsTaken': 0
    });

    displayDebuffs(scene, portraitContainer, halfW, halfH);  // add debuff display
    createTurnMeter(scene, portraitContainer, halfW, halfH, uiStats.borderRadius);  // add turn meter

    return portraitContainer;
}

// Creates and adds turn meter graphics to container.
function createTurnMeter(scene, container, halfW, halfH, borderRadius){
    const tmGraphics = scene.add.graphics();
    tmGraphics.fillStyle(0xBDB9B9, 1.0);
    tmGraphics.fillRoundedRect(-halfW, halfH + uiStats.hpBarHeight + 2*uiStats.marginPortraitHpBar/3, 2*halfW, uiStats.tmHeight, borderRadius);
    const tm = container.getData('turnMeter');
    if (tm){
        tmGraphics.fillStyle(0x00FF00, 1.0);
        tmGraphics.fillRoundedRect(-halfW + uiStats.paddingHpBar,
                                    halfH + uiStats.hpBarHeight + 2*uiStats.marginPortraitHpBar/3 + uiStats.paddingHpBar,
                                    (2*halfW - 2*uiStats.paddingHpBar)*1,
                                    uiStats.tmHeight - 2*uiStats.paddingHpBar,
                                    borderRadius);
    }
    container.add(tmGraphics);
    container.setData('tmGraphics', tmGraphics);
}

// Creates aan hp graphics object and returns it.
function createHpGraphics(scene, x, y, width, height, borderRadius, colorOuter, colorInner, hp){
    // HP BARS:
    var hpGraphics = scene.add.graphics();
    // Grey background:
    hpGraphics.fillStyle(colorOuter, 1.0);
    hpGraphics.fillRoundedRect(x, y, width, height, borderRadius);  // x,y,width,height,border radius

    const pad = uiStats.paddingHpBar;

    // Red bar:
    if (hp > 0){  // otherwise weird red pixels
        hpGraphics.fillStyle(colorInner, 1.0);
        hpGraphics.fillRoundedRect(x + pad, y + pad, (width - 2*pad) * hp, height - 2*pad, borderRadius);
    }
    return hpGraphics;
}

// Creates aan hp text object and returns it.
function createHpText(scene, x, y, text, fontOptions){
    const hpText = scene.add.text(x, y, text, fontOptions).setOrigin(0.5);
    return hpText;
}

// Displays debuffs of character.
function displayDebuffs(scene, container, xOffset, yOffset){
    const debuffs = container.getData('debuffs') || [];
    const debuffContainer = scene.add.container(xOffset-uiStats.margin-10, -yOffset+20);  // top right of image
    var yStep = 0;
    debuffs.forEach(debuff => {
        const debuffDisplay = scene.add.text(0, yStep, debuff.name + " (" + debuff.duration + ")", {fontSize: '12px', color: '#ff0000', fontFamily: 'Arial'}).setOrigin(0,0.5);
        yStep+=20;
        debuffContainer.add(debuffDisplay);
    });
    container.add(debuffContainer);
    container.setData('debuffContainer', debuffContainer);
}

// Resizes all player containers to fit new window size.
function resizePlayerContainers(scene, team){
    const spaceNeeded = team.length * uiStats.portraitWidth + (team.length-1)*uiStats.margin;  // #portraits*width + margins between them
    const whiteSpacePerSide = (scene.scale.width - spaceNeeded)/2;  // how much space on either side? (for xPos of first portrait)
    var xPos = whiteSpacePerSide + uiStats.portraitWidth/2;  // REMEMBER: CENTER-BASED POSITIONING!
    for (let index = 0; index < team.length; index++) {
        const container = team[index];
        resizeCharacterDisplay(scene, container, xPos, uiStats.halfH + 20, uiStats.portraitScale);
        xPos+=uiStats.portraitWidth + uiStats.margin;  // enough spacing with margin   
    }
}

// Resizes all enemy containers to fit new window size.
function resizeEnemyContainers(scene, team){
    const spaceNeeded = team.length * uiStats.portraitWidth + (team.length-1)*uiStats.margin;  // #portraits*width + margins between them
    const whiteSpacePerSide = (scene.scale.width - spaceNeeded)/2;  // how much space on either side? (for xPos of first portrait)
    var xPos = whiteSpacePerSide + uiStats.portraitWidth/2;  // REMEMBER: CENTER-BASED POSITIONING!
    const yOffset = scene.scale.height - uiStats.halfH - 20 - 35;
    for (let index = 0; index < team.length; index++) {
        const container = team[index];
        resizeCharacterDisplay(scene, container, xPos, yOffset, uiStats.portraitScale);
        xPos+=uiStats.portraitWidth + uiStats.margin;  // enough spacing with margin   
    }
}

// Rsizes container display to fit new window size including: portrait, hp bar, turn meter bar, border.
function resizeCharacterDisplay(scene, container, newX, newY, newScale){
    container.x = newX;
    container.y = newY;
    const portrait = container.list[0];
    portrait.setScale(newScale);

    // Recalculate dimensions:
    const halfW = portrait.displayWidth / 2;
    const halfH = portrait.displayHeight / 2;

    // Update stored data (maybe remove this in the future, but storing per container may be better for boss fights ==> different individual dims):
    container.setData('halfW', halfW);
    container.setData('halfH', halfH);
    container.setData('displayWidth', portrait.displayWidth);
    container.setData('displayHeight', portrait.displayHeight);

    container.input.hitArea = new Phaser.Geom.Rectangle(-halfW, -halfH, portrait.displayWidth, portrait.displayHeight);  // adjust hitArea to match new size

    const hpText = container.getData('hpText');
    const hpTextYPos = halfH + uiStats.marginPortraitHpBar + (uiStats.hpBarHeight-2*uiStats.paddingHpBar)/2 + uiStats.paddingHpBar;
    // y = halfH + uiStats.marginPortraitHpBar + redbarHeight/2 + uiStats.paddingHpBar = halfH + 5 + 12 + 3 = halfH + 20
    hpText.y = hpTextYPos;

    // Redraw border:
    const borderGraphics = container.getData('borderGraphics');
    borderGraphics.clear();
    borderGraphics.lineStyle(2, 0xFFE836, 1);
    borderGraphics.strokeRoundedRect(-uiStats.halfW, -uiStats.halfH, portrait.displayWidth, portrait.displayHeight, uiStats.borderRadius);

    // Redraw HP bar (reuse your updateHP logic):
    const currentHp = container.getData('hp');
    updateHP(container, currentHp);  // clears and redraws with new dimensions

    // Redraw turn meter:
    updateTurnMeter(scene, container, Math.min(container.getData('turnMeter') / gameState.combinedSpeed, 1));  // clear + redraw

    // Update debuffs:
    updateDebuffDisplay(scene, container);
}

// Sets an ally container interactive
function setAllyInteractive(scene, container, portrait, options, tint){
    container.setInteractive(options)
    .on('pointerdown', (pointer) => {
        if (pointer.button !== 0) return;  // only left click!
        // Player chose a character AND it's the player's turn AND this target is not dead...
        if (gameState.turn === 'player'  && gameState.pendingSkill){
            if (gameState.pendingSkill.type === 'Attack') return;  // don't show on attack skills
            if (container.getData('hp') > 0 || gameState.pendingSkill.type === 'Revive'){  // always allow to target alive allies or with a revive spell
                const skill = gameState.pendingSkill;
                gameState.pendingSkill = null;  // prevent spamming!
                clearAffectedAllies();  // remove targeting visuals
                applySkill(scene, container.getData('teamIndex'), skill);               
            }
        }
    })
    .on('pointerover', () => {
        if(gameState.pendingSkill && gameState.turn === 'player' && container.getData('hp') > 0){
            if (gameState.pendingSkill.type !== 'Attack')
            previewTargets(scene, gameState.pendingSkill, container.getData('teamIndex'), gameState.playerContainers, uiStats.allyTargetTint);
        } else {
            portrait.setTint(tint);
        }
    })
    .on('pointerout', () => {
        if(gameState.pendingSkill && gameState.turn === 'player'){  // skill selected ==> potentially multiple targets ==> clear all tints
            clearAffectedAllies();
        } else {
            portrait.clearTint();
        }
    });
}

// Sets data specified in dataDictionary in container.
function setContainerData(container, dataDictionary){
    for (const [key, value] of Object.entries(dataDictionary)) {
        container.setData(key, value);
    }
}

// Sets hover interactivity to container portraits.
function setContainerInteractive(scene, container, portrait, options, team){
    if (team === 'enemy') setEnemyInteractive(scene, container, portrait, options, uiStats.enemyHoverTint);
    else setAllyInteractive(scene, container, portrait, options, uiStats.allyHoverTint);
}

// Sets an enemy container interactive.
function setEnemyInteractive(scene, container, portrait, options, tint){
    container.setInteractive(options)
    .on('pointerdown', (pointer) => {
        if (pointer.button !== 0) return;  // only left click!
        // Player chose a character AND it's the player's turn AND this target is not dead...
        if (gameState.turn === 'player'  && container.getData('hp') > 0 && gameState.pendingSkill){
            if (gameState.pendingSkill.type !== 'Attack') return;  // don't show on support skills
            const skill = gameState.pendingSkill;
            gameState.pendingSkill = null;  // prevent spamming!
            clearAffectedTargets();  // remove targeting visuals
            applySkill(scene, container.getData('teamIndex'), skill);               
        }
    })
    .on('pointerover', () => {
        if(gameState.pendingSkill && gameState.turn === 'player'){
            if (gameState.pendingSkill.type !== 'Attack') return;  // don't preview on ally skills
            previewTargets(scene, gameState.pendingSkill, container.getData('teamIndex'), gameState.enemyContainers, uiStats.enemyTargetTint);
        } else {
            portrait.setTint(tint);
        }
    })
    .on('pointerout', () => {
        if(gameState.pendingSkill && gameState.turn === 'player'){  // skill selected ==> potentially multiple targets ==> clear all tints
            clearAffectedTargets();
        } else {
            portrait.clearTint();
        }
    });
}