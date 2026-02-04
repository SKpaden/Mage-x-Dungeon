import { gameState } from "../game/gameState.js";
import { applySkill } from "../game/combat.js";
import { endTurn } from "../game/turnManager.js";
import { previewTargets, clearAffectedTargets } from "./skillUI.js";
import { uiStats } from "./uiStats.js";
import { Debuff } from "../game/debuffs.js";
import { Effect2 } from "../game/effects.js";

// Creates enemy portraits.
export function createEnemyPortrait(scene, x, y, imageKey, scale, maxHp, speed, name, team, index){
    const portraitContainer = createCharacterContainer(scene, x, y, imageKey, scale, maxHp, speed, name, team, index);

    portraitContainer.on('pointerdown', (pointer) => {
        if (pointer.button !== 0) return;  // only left click!
        // Player chose a character AND it's the player's turn AND this target is not dead...
        if (gameState.turn === 'player'  && portraitContainer.getData('hp') > 0 && gameState.pendingSkill){
            applySkill(scene, portraitContainer.getData('teamIndex'));
            //dmgTarget(scene, 50, gameState.selectedPlayer, portraitContainer);                
        }
    });

    return portraitContainer;
}

// Creates a character portrait in the scene.
export function createHeroPortrait(scene, x, y, imageKey, scale, maxHp, speed, name, team, index){
    const portraitContainer = createCharacterContainer(scene, x, y, imageKey, scale, maxHp, speed, name, team, index);           
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

// Updates the debuff display.
export function updateDebuffDsiplay(scene, container){
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
    hpGraphics.fillRoundedRect(-halfW, halfH + 5, displayWidth, 30, 5);
    // Redraw red fill:
    if (newHp > 0) {
        hpGraphics.fillStyle(0xDE1616, 1.0);
        const barWidth = (displayWidth - 6) * (newHp/maxHp);
        hpGraphics.fillRoundedRect(-halfW + 3, halfH + 5 + 3, barWidth, 24, 5);
    } else {
        newHp = 0;
        container.setAlpha(0.4);
    }

    // Update text:
    const hpText = container.getData('hpText');
    hpText.setText(`${newHp}/${maxHp}`);
    container.setData('hp', newHp);
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
    borderGraphics.lineStyle(2, color, 1);

    borderGraphics.strokeRoundedRect(x, y, width, height, borderRadius);
    return borderGraphics;
}

// Creates base layout and strucuture for a character container.
function createCharacterContainer(scene, x, y, imageKey, scale, maxHp, speed, name, team, index){
    if(!scene.textures.exists(imageKey)){
        console.warn(`Failed to load ${imageKey}!`);
    }
    const portrait = scene.add.image(0, 0, imageKey).setScale(scale);
    const halfW = portrait.displayWidth/2;
    const halfH = portrait.displayHeight/2;

    var borderGraphics = createBorderGraphics(scene, -halfW, -halfH, portrait.displayWidth, portrait.displayHeight, 5, 0xFFE836);
    
    // HP BARS:
    var hpGraphics = createHpGraphics(scene, -halfW, halfH + uiStats.marginPortraitHpBar, portrait.displayWidth,
                                        uiStats.hpBarHeight, uiStats.borderRadius, 0xBDB9B9, 0xDE1616, 1);

    // y = halfH + marginPortraitBar + redBar.height/2 + paddingGreyBar = halfH + 5 + 12 + 3 = halfH + 20
    const hpText = createHpText(scene, 0, halfH + 20, `${maxHp}/${maxHp}`, {fontSize: '14px', color: '#000000', fontFamily: 'Arial'});
    
    const portraitContainer = scene.add.container(x, y);  // previous portrait location

    // Add all children to the container (order matters!):
    addToContainer(portraitContainer, [portrait, borderGraphics, hpGraphics, hpText]);  // order matters!

    // Make the container interactive:
    setContainerInteractive(portraitContainer, portrait,
                            {
                                hitArea: new Phaser.Geom.Rectangle(-halfW, -halfH, portrait.displayWidth,portrait.displayHeight),
                                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                                useHandCursor: true
                            }, 0x820000);
    
    
    // Skills:
    const skills = [
        { id: 'basicAttack', name: 'Posion Claw', icon: 'Poison Claw.jpg', targets: 'single', effect: new Effect2(40, 'holy', new Debuff("Poison", 3, 25, "holy", null, false, "elemental"), "Poison", '#0fee65')},
        //{ id: 'fireball', name: 'Fireball', icon: 'Fireball.jpg', targets: 'single', dmg: 60, element: 'fire' },
        { id: 'fireball', name: "Fireball", icon: "Fireball.jpg", targets: 'adjacent', effect: new Effect2(60, 'fire', new Debuff("Burn", 2, 20, "fire", null, false, "elemental"), "Fire")},
        { id: 'holy', name: 'Holy Light', icon: 'Holy Light.jpg', targets: 'adjacent', effect: new Effect2(35, 'holy', new Debuff("Blinded", 3, 0, "holy", null, false, "elemental"), "Holy", '#f0ff20')},
        { id: 'nova', name: 'Dark Nova', icon: 'Dark Nova.jpg', targets: 'all', effect: new Effect2(25, 'dark', new Debuff("Scared", 1, 0, "dark", null, true, "cc"), "Dark", '#b700ff')}
    ];
    // Store data in container:
    setContainerData(portraitContainer, {
        'name': name,
        'halfW': halfW,
        'halfH': halfH,
        'displayWidth': portrait.displayWidth,
        'displayHeight': portrait.displayHeight,
        'hpGraphics': hpGraphics,
        'borderGraphics': borderGraphics,
        'hpText': hpText,
        'hp': maxHp,
        'maxHp': maxHp,
        'speed': speed,
        'skills': skills,
        // 'debuffs': [new Debuff('Wet', 3, 0, 'water'), new Debuff('Shock', 2, 10, 'lightning')],
        'debuffs': [new Debuff('Shock', 3, 10, 'electro')],
        'buffs': [],
        'team': team,
        'teamIndex': index
    });

    displayDebuffs(scene, portraitContainer, halfW, halfH);  // add debuff display

    return portraitContainer;
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

// Sets data specified in dataDictionary in container.
function setContainerData(container, dataDictionary){
    for (const [key, value] of Object.entries(dataDictionary)) {
        container.setData(key, value);
    }
}

// Sets hover interactivity to container portraits.
function setContainerInteractive(container, portrait, options, tint){
    container.setInteractive(options).on('pointerover', () => {
        if(gameState.pendingSkill && gameState.turn === 'player'){
            previewTargets(gameState.pendingSkill, container.getData('teamIndex'));
        } else {
            portrait.setTint(tint);
        }
    })
                                        .on('pointerout', () => {
                                        if(gameState.pendingSkill && gameState.turn === 'player'){
                                            clearAffectedTargets();
                                        } else {
                                            portrait.clearTint();
                                        }
                                    });
}