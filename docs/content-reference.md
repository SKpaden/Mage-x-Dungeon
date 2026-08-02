# Content Reference

This file is a quick lookup for creating skills, debuffs, and other combat content in the game.

## Creating a skill

A skill is defined in the skill template table in [data/skills.js](data/skills.js).

### Basic shape

```js
// Example skill id:
3: {
    name: 'Skill Name',
    icon: 'Skill Name.jpg',
    targets: 'single',
    actions: [
        { className: 'DealDamage', params: { area: 'single', dmg: 60, element: 'Physical' } }
    ],
    cooldown: 3,
    description: 'Short description of what the skill does.'
}
```

### Common fields

- `name`: display name of the skill
- `icon`: image filename used for the skill icon
- `targets`: target mode
  - `'single'`
  - `'all'`
  - `'adjacent'`
- `actions`: array of skill parts that run in order
- `cooldown`: number of turns before the skill can be used again
- `description`: text shown in the UI
- `type`: optional, used for special behavior
  - `'Support'` for support skills
  - `'Revive'` for revive skills

### Multiple skill parts

You can chain several actions in one skill:

```js
8: {
    name: 'War Cry',
    icon: 'War Cry.jpg',
    targets: 'all',
    actions: [
        { className: 'ResetCD', params: { area: 'all' } },
        { className: 'FullCleanse', params: { area: 'all' } }
    ],
    cooldown: 5,
    description: 'Resets all ally skill cooldowns and removes all debuffs from all allies.',
    type: 'Support'
}
```

### Common SkillParts

- `DealDamage`
  - `params.area`: `'single'`, `'all'`, `'adjacent'`
  - `params.dmg`: damage amount
  - `params.element`: element name such as `'Physical'`, `'Fire'`, `'Poison'`

- `ApplyDebuff`
  - `params.area`: target area
  - `params.debuff`: a debuff instance

- `ResetCD`
  - `params.area`: target area

- `FullCleanse`
  - `params.area`: target area

- `BoostTurnMeter`
  - `params.area`
  - `params.amount`: fraction like `0.3` for 30%

- `IncreaseDebuffDuration`
  - `params.area`
  - `params.amount`: number of turns to add

- `ActivatePoison`
  - `params.area`

---

## Creating a basic debuff

Debuffs are created with the `Debuff` class in [game/debuffs.js](game/debuffs.js).

### Basic example

```js
new Debuff('Poison', 3, 50, 'Poison', null, false, 'elemental', null)
```

### Arguments

The positional constructor is:

```js
new Debuff(name, duration, dmgPerTurn, element, triggerEffect, skipTurn, type, appliedBy)
```

Meaning:

- `name`: debuff name
- `duration`: number of turns before expiration
- `dmgPerTurn`: tick damage
  - number for absolute damage
  - object for percent-based damage such as `{ type: 'percent', amount: 0.05 }`
- `element`: element tag, for example `'Poison'`, `'Fire'`, `'Electro'`
- `triggerEffect`: optional effect callback or effect object
- `skipTurn`: whether this debuff causes the target to skip its turn
- `type`: `'elemental'`, `'cc'`, or `'normal'`
- `appliedBy`: source container or owner

### Example: poison

```js
new Debuff('Poison', 3, { type: 'percent', amount: 0.05 }, 'Poison', null, false, 'elemental', null)
```

This creates a poison debuff that deals 5% of the target's current or base HP per tick depending on the implementation.

---

## Creating a stat-affecting debuff

Stat-affecting debuffs are created with `StatAffectingDebuff`.

### Example: vulnerable

```js
new StatAffectingDebuff({
    name: 'Vulnerable',
    duration: 2,
    stat: 'dmgTakenMult',
    effect: { amount: 0.25, op: 'inc' }
})
```

### Fields

- `name`: debuff name
- `duration`: duration in turns
- `stat`: which stat to affect, such as `'speed'` or `'dmgTakenMult'`
- `effect`: effect definition
  - `amount`: percentage or additive amount
  - `op`: `'inc'` or `'dec'`

### Example: speed reduction

```js
new StatAffectingDebuff({
    name: 'Cold',
    duration: 2,
    stat: 'speed',
    effect: { amount: 0.25, op: 'dec' }
})
```

---

## Creating a control debuff

Control debuffs can force a target to act differently.

### Example

```js
new ControlDebuff('Mind Control', 1)
```

This is useful for CC-style effects that make a unit act in a special way.

---

## Quick recipe summary

### Single-hit skill

```js
{
    name: 'Example',
    icon: 'Example.jpg',
    targets: 'single',
    actions: [
        { className: 'DealDamage', params: { area: 'single', dmg: 60, element: 'Physical' } }
    ],
    cooldown: 3,
    description: 'Example skill.'
}
```

### Skill with debuff

```js
{
    name: 'Example Debuff Skill',
    icon: 'Example Debuff Skill.jpg',
    targets: 'single',
    actions: [
        { className: 'ApplyDebuff', params: { area: 'single', debuff: new Debuff('Poison', 3, 50, 'Poison', null, false, 'elemental', null) } }
    ],
    cooldown: 3,
    description: 'Applies a poison debuff.'
}
```

### Skill with multiple actions

```js
{
    name: 'Example Combo',
    icon: 'Example Combo.jpg',
    targets: 'all',
    actions: [
        { className: 'ResetCD', params: { area: 'all' } },
        { className: 'FullCleanse', params: { area: 'all' } }
    ],
    cooldown: 5,
    description: 'Example combo skill.'
}
```
