import { gameState } from "./gameState.js";

class Reaction{
    constructor(name, target, effect){
        this.name = name;
        this.target = target;
        this.effect = effect;
    }

    // Gets by this Reaction affected targets.
    getAffectedTargets(team, index){
        const teamContainers = team === 'enemy' ? gameState.enemyContainers : gameState.playerContainers;
        switch(this.target){
            case 'single':
                return [index];
            case 'adjacent':
                const adj = [index, index-1, index+1];
                return adj.filter(i => i >= 0 && i < teamContainers.length && teamContainers[i].getData('hp') > 0);  // valid index + alive
            case 'all':
                const all = [];
                var i = 0;
                while(i < teamContainers.length){
                    if(teamContainers[i].getData('hp') > 0) all.push(i);
                    i++;
                }
                return all;
            default:
                console.error("NO VALID TARGET IN AFFECTED TARGETS IN REACTION!");
                return;
        }
    }
}

export class Explosion extends Reaction{
    constructor(effect){
        super("Explosion", 'adjacent', effect);  // effect should stay variable because dmg and duration could be dynamic
    }
}

export class VoidSurge extends Reaction{
    constructor(effect){
        super('Void Surge', 'all', effect);
    }
}