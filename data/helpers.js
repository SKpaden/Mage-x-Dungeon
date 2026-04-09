
// Returns a rendom order of indexes for AllyAttack SkillPart.
export function getAttackOrder(mustInclude, allowedRange){
    const candidates = [];
    for (let i = 0; i < allowedRange; i++){
        if (i !== mustInclude) candidates.push(i);  // exclude mustInclude ==> put in the front later (first attack)
    }
    for (let i = 0; i < candidates.length; i++){
        const randIndex = Math.floor(Math.random() * (allowedRange-1));
        [candidates[i], candidates[randIndex]] = [candidates[randIndex], candidates[i]];
    }

    return [mustInclude, ...candidates];
}