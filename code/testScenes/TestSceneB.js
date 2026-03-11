export default class TestSceneB extends Phaser.Scene {
    constructor() { super({ key: 'testB', active: true }); }  // add active: true to start scene even if it's not in first position in scene: []
    // Load assets:
    preload() {
    }

    create() {
        console.log("TestSceneB running!");

        this.registry.events.on('changedata', this.eventHandler, this);
    }

    eventHandler(parent, key, data){  // key: check what value changed; data: new value
        if (key === 'hp') {
            console.log("[HP] " + data);
        } else if (key === 'speed'){
            console.log("[SPEED] " + data);
        }
    }

    update() {}
}
