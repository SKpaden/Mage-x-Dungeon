export class SkillContext {
    constructor(scene, source, target, index, allies, enemies) {
        this.scene = scene;
        this.source = source;
        this.target = target;
        this.index = index,
        this.allies = allies;
        this.enemies = enemies;

        this.results = {
            damageDealt: new Map(),   // targetId → damage
            healingDone: new Map(),
            debuffsApplied: [],
            reactionsTriggered: [],
            flags: {}                 // arbitrary flags for chaining logic
        };
    }
}
