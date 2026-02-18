import { uiStats } from "./uiStats.js";

// Return an one-time-use tween for (physical) attacks: Container moves to target location and triggers screen shake => simulate "hit".
export function playPhysicalAttackTween(scene, container, targetX, targetY){
    let offset;  // looks a bit better imo to not go fully on top of target portrait
    if (container.y < targetY) offset = -uiStats.halfH;  // container below target
    else offset = uiStats.halfH;  // container above target
    scene.tweens.add({
        targets: container,
        duration: 150,
        x: targetX,
        y: targetY + offset,
        z: 100,
        yoyo: true,  // return to starting state
        //ease: 'Expo.easeInOut',
        ease: 'Quad.easeInOut',
        onStart: () => {
            scene.children.bringToTop(container);  // render above other characters
        },
        onYoyo: () => {
            scene.cameras.main.shake(200, 0.01);
        }
    });
}