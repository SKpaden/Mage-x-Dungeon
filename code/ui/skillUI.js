import { uiStats } from "./uiStats.js";
import { gameState } from "../game/gameState.js";
import { getAffectedTargets } from "../game/combat.js";

let escBtn = null;  // register keyboard key

// Removes tints from preview targets.
export function clearAffectedTargets(){
    gameState.enemyContainers.forEach(container => {
        container.list[0].clearTint();
    });
}

// Inits event listeners for skill display.
export function initSkillEventListener(scene){
    if (escBtn) return;
    escBtn = scene.input.keyboard.addKey("ESC");
    escBtn.on('down', () => handleEscDown(scene));
}

// Shows visual cue (tint) on all targets that would be affected by gameState.pendingSkill.
export function previewTargets(scene, skill, index){
    const affectedTargets = getAffectedTargets(skill, index, gameState.enemyContainers);
    gameState.enemyContainers.forEach((enemy, i) => {
        const isAffected = affectedTargets.includes(i) && enemy.getData('hp') > 0;
        enemy.list[0].setTint(isAffected ? 0xff4444 : 0x88ccff);  // red for affected, blue for valid
    });
}

// Shows a dmg popup on target location.
export function showDmgPopup(scene, x, y, text, textOptions){
    const dmgText = scene.add.text(x, y, text, textOptions).setOrigin(0.5);
    scene.tweens.add({
        targets: dmgText,
        y: '-=100',
        alpha: 0,
        duration: 800,
        onComplete: () => dmgText.destroy()
    });
}

// Displays skills of current player character selected.
export function showSkills(scene, container){
    const skills = container.getData('skills');
    const containerHeight = container.getData('displayHeight');
    // y = offset + halfHeight - halfHeight icons - portraitBorderWidth/2 - padding/2:
    const y = container.y + containerHeight/2 - uiStats.skillIconDims/2 - uiStats.portraitHighlightBorderWidth/2 - uiStats.paddingHpBar;
    const buttonWidth = uiStats.skillIconDims;
    const spacing = uiStats.skillIconMargin;
    // offset + CENTER-BASED POSITIONING - spaceNeeded/2:
    const startX = 0 + buttonWidth/2 - (skills.length * buttonWidth + (skills.length - 1) * spacing) / 2;  // offset in container is 0!

    const skillContainer = scene.add.container(container.x, y);
    scene.currentSkillContainer = skillContainer;

    const background = scene.add.rectangle(0,0, (2*uiStats.paddingHpBar + skills.length * buttonWidth + (skills.length - 1) * spacing), buttonWidth + 2*uiStats.paddingHpBar, 0x111111).setInteractive( { useHandCursor: false});
    skills.forEach((skill, i) => {
        const btn = scene.add.rectangle(startX + i * (buttonWidth + spacing), 0, buttonWidth, buttonWidth, 0x333333);
        const skillText = scene.add.text(btn.x, - 40, skill.name, { fontSize: '16px', color: '#fff' }).setOrigin(0.5).setVisible(false);
        btn.setInteractive({ useHandCursor: true })
            .on('pointerdown', (pointer) => {
                //if (pointer.button !== 0) return;  // only left click!
                if (pointer.button !== 0 || skill.currentCD) return;  // only left click and available skills!
                gameState.pendingSkill = skill;
                scene.message.setText(`Use ${skill.name}? Hover enemies!`);
                skillContainer.destroy();  // clean up
            })
            .on('pointerover', () => skillText.setVisible(true))  // tooltip
            .on('pointerout', () => skillText.setVisible(false));

        // const icon = scene.add.image(btn.x, btn.y, skill.icon).setScale(uiStats.skillIconScale);
        const icon = skill.addIcon(scene, btn.x, btn.y, uiStats.skillIconScale);
        const skillCD = skill.currentCD;
        if (skillCD){
            const iconCD = scene.add.text(btn.x, btn.y, skill.currentCD, { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
            skillContainer.add([background,btn, icon, skillText, iconCD]);
        } else {
            skillContainer.add([background,btn, icon, skillText]);
        }
    });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

function handleEscDown(scene){
    if (gameState.turn !== 'player' || !gameState.pendingSkill) return;
    
    if (scene.currentSkillContainer) {
        scene.currentSkillContainer.destroy();
        scene.currentSkillContainer = null;
    }
    gameState.pendingSkill = null;  // reset skill
    clearAffectedTargets();  // clear previews

    // Re-show skills for current player:
    showSkills(scene, gameState.selectedPlayer);
}