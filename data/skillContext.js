export class SkillContext {
    constructor(scene, source, target, index, allies, enemies, affectedTargets = null) {
        this.scene = scene;
        this.source = source;
        this.target = target;
        this.index = index,
        this.allies = allies;
        this.enemies = enemies;

        this.affectedTargets = affectedTargets ? affectedTargets : [index];
        this.currentTarget = null;  // events need to process current targets, not just the original target

        // Pipelines might add these flags / fields:
        // - blocked
        // - death
        // - debuff
        // - dmg
        // - element
        // - logQueueKey
        // - modifiedDamage
        // - type

        this.results = {
            damageDealt: new Map(),   // targetId → damage
            healingDone: new Map(),
            debuffsApplied: [],
            reactionsTriggered: [],
            flags: {}                 // arbitrary flags for chaining logic
        };
    }
}
