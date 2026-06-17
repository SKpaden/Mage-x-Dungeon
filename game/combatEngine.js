import { CombatEventBus } from '../eventBus/combatEventBus.js';
import { registerDamagePipeline } from '../eventBus/pipelines/damagePipeline.js';
import { registerDeathPipeline } from '../eventBus/pipelines/deathPipeline.js';
import { registerDebuffPipeline } from '../eventBus/pipelines/debuffPipeline.js';
import { registerHealPipeline } from '../eventBus/pipelines/healPipeline.js';
import { registerTMPipeline } from '../eventBus/pipelines/turnMeterPipeline.js';

export class CombatEngine {
    constructor(playerTeam, enemies) {
        this.playerTeam = playerTeam;
        this.enemyTeam = enemies;

        this.eventBus = new CombatEventBus();
        
        // Register pipeline:
        registerDamagePipeline(this);
        registerDeathPipeline(this);
        registerDebuffPipeline(this);
        registerHealPipeline(this);
        registerTMPipeline(this);

        this.registerPassives();
    }

    /**
     * Returns the allied team for a team name.
     * @param {String} teamName The team name to get allies for
     * @returns {Array.<Object>} The array of allies
     */
    getAllies(teamName){
        return teamName === 'player' ? this.playerTeam : this.enemyTeam;
    }

    /**
     * Returns the adversarial team for a team name.
     * @param {String} teamName The team name to get enemies for
     * @returns {Array.<Object>} The array of enemies
     */
    getEnemies(teamName){
        return teamName === 'player' ? this.enemyTeam : this.playerTeam;
    }

    /**
     * Registers all Characters' Passives to the event bus.
     */
    registerPassives() {
        const allCharacters = [...this.playerTeam, ...this.enemyTeam];

        for (const container of allCharacters) {
            const char = container.getData('char');
            if (!char.passives) continue;

            for (const passive of char.passives) {
                passive.registerEvents(this.eventBus, container);
            }
        }
    }


    /**
     * Runs an intent emitted by a SkillPart.
     * For now, it only forwards the intent to the event bus.
     */
    async runIntent(intent) {
        await this.eventBus.emit(intent.type, intent);
    }
}