import { gameState } from "../game/gameState.js";
import { uiStats } from "./uiStats.js";

let logDom = null;
let logTarget = null;

// Gets the current logTarget.
export function getLogTarget(){
    return logTarget;
}

// Inits the combat log by adding it to the scene as a DOM element.
export function initCombatLog(scene, x, y, width = 500, height = 180) {
    // if (logDom) return logDom;  // singleton

    const div = document.createElement('div');
    div.className = 'combat-log';
    div.style.cssText = `
        width: ${width}px;
        height: ${height}px;
        background: rgba(0,0,0,0.65);
        color: #e0e0e0;
        font-family: Arial, sans-serif;
        font-size: 14px;
        padding: 12px;
        overflow-y: auto;
        border-radius: 8px;
        pointer-events: auto;
        user-select: text;
        line-height: 1.4;
    `;

    // Scrollbar styling
    div.style.scrollbarWidth = 'thin';
    div.style.scrollbarColor = 'rgba(150,150,150,0.5) transparent';

    logDom = scene.add.dom(x, y, div);
    logDom.setOrigin(0, 0.5);  // middle left

    return logDom;
}

export function logCombat(scene, message, color = '#e0e0e0', prefix = '') {
    const entry = document.createElement('div');
    entry.style.cssText = `color: ${color}; margin-bottom: 4px;`;
    entry.innerHTML = prefix ? `<span style="color:#888;">${prefix}</span> ${message}` : message;
    // Keep it at a reasonable length (or maybe remove later):
    while (logDom.node.children.length > 50) {
        logDom.node.removeChild(logDom.node.firstChild);
    }
    logDom.node.appendChild(entry);

    // Auto-scroll to bottom:
    logDom.node.scrollTop = logDom.node.scrollHeight;
}

// Adds log based on queued effects.
export function processLogQueue(scene, queue, source){
    let color;
    if (gameState.turn === 'player') color = uiStats.playerLogColor;
    else color = uiStats.enemyLogColor;

    const entry = document.createElement('div');
    entry.style.cssText = `color: ${color}; margin-bottom: 4px`;
    let logText = '';
    for (const [key, values] of Object.entries(queue)){
        if (values.debuffsApplied) logText += `<small>Applied ${values.debuffsApplied} debuff(s).</small><br>`;
        if (values.reactionsTriggered) logText += `<small>Triggered ${values.reactionsTriggered} reaction(s)!</small><br>`;

        if (values['dmg'] && values['dmg'].length > 0) {
            const totalDmg = values['dmg'].reduce(function(acc, element) {return acc + element;}, 0);  // 0 as initial value
            logText += `<strong>${key}</strong>` + `: ${totalDmg} damage to ${values['targets'].length} target(s).<br>`;
        }
    }

    entry.innerHTML = logText;

    // Keep it at a reasonable length (or maybe remove later):
    while (logDom.node.children.length > 50) {
        logDom.node.removeChild(logDom.node.firstChild);
    }
    logDom.node.appendChild(entry);

    // Auto-scroll to bottom:
    logDom.node.scrollTop = logDom.node.scrollHeight;
}

// Sets the logTarget.
export function setLogTarget(logString){
    logTarget = logString;
    gameState.logQueue[logString] = { 'targets': [], 'dmg': [], debuffsApplied: 0, reactionsTriggered: 0};
}