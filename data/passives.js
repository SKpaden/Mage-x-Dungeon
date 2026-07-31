// Base Passive class.
export class Passive {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }

    registerEvents(eventBus, ownerContainer) {
    }
}

// Character is immune to certain debuffs.
export class DebuffImmunityPassive extends Passive {
    constructor(debuffNames) {  // example: ['Stun', 'Poison']
        super('Immunity', `Immune to ${debuffNames.join(', ')}`);
        this.debuffNames = debuffNames;
    }

    // // Registers the event to events array:
    // registerEvents(events) {
    //     events.set('onApplyDebuff', (debuff, source) => {
    //         return !this.debuffNames.includes(debuff.name);
    //     });
    // }

    registerEvents(eventBus, ownerContainer) {
        eventBus.on("beforeApplyDebuff", ctx => {
            if (ctx.currentTarget !== ownerContainer) return;

            if (this.debuffNames.includes(ctx.data.debuff.name)) {
                ctx.flags.blocked = true;
                console.log("Debuff blocked by passive!");
            }
        });
    }

    // Maybe if I need multiple handlers, but highly unlikely imo:
    // registerEvents(events) {
    //     const existing = events.get('onApplyDebuff') || [];
    //     existing.push((debuff, source) => {
    //         return !this.debuffNames.includes(debuff.name);
    //     });
    //     events.set('onApplyDebuff', existing);
    // }
}
// Character is immune to certain types of effects (e.g., cooldown increase).
export class EffectImmunityPassive extends Passive {
    constructor(effects) {  // example: ['CooldownIncrease', 'BuffRemoval', 'DebuffDurationIncrease',...]
        super('Immunity', `Immune to ${effects.join(', ')}`);
        this.effects = effects;
    }

    // Registers the event to events array:
    registerEvents(events) {
        events.set('onApplyEffect', (effect, source) => {  // pass like target.triggerEvent('onApplyEffect', 'CooldownIncrease', source)
            if (this.effects.includes(effect)) {
                return false;  // block application
            }
            return true;  // allow
        });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MAP FOR CHARACTER TEMPLATES:

// Return a Passive object matching the passiveTemplate passed to it.
export function getPassiveObjects(passiveTemplates){
    return passiveTemplates.map(p => {
        if (p.type === 'DebuffImmunity') return new DebuffImmunityPassive(p.params.debuffNames);
        if (p.type === 'EffectImmunity') return new EffectImmunityPassive(p.params.effects);
    });
}