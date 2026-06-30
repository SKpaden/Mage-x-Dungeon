export class SkillContext {
    constructor(scene, source, target, index, allies, enemies, logQueueKey, affectedTargets = null) {
        this.scene = scene;
        this.source = source;
        this.target = target;
        this.index = index,
        this.allies = allies;
        this.enemies = enemies;
        this.logQueueKey = logQueueKey;

        this.affectedTargets = affectedTargets ? affectedTargets : [target];
        this.currentTarget = null;  // events need to process current targets, not just the original target

        // Pipelines might add these flags / fields:
        // - blocked
        // - death
        // - debuff
        // - dmg
        // - element
        // - logQueueKey
        // - modifiedDamage

        // Examples: 
        // flags.popupDelay = true;
        // skillContext.data.delay = 300;
        this.flags = {};  // set global flags for the Skill execution
        this.data = {};  // pass additional data only used by some Skills/SkillParts

        this.results = {
            damageDealt: new Map(),   // targetId → damage
            healingDone: new Map(),
            debuffsApplied: [],
            reactionsTriggered: [],
            flags: {}                 // arbitrary flags for chaining logic
        };
    }
}
