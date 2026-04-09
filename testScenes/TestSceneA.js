export default class TestSceneA extends Phaser.Scene {
    constructor() {
        super({ key: 'testA' });

        this.hp = 100;
        this.speed = 20;
    }
    // Load assets:
    preload() {
    }

    create() {
        console.log("TestSceneA running!");

        this.registry.set('hp', this.hp);
        this.registry.set('speed', this.speed);

        this.input.on('pointerdown', this.clickHandler, this);
    }

    clickHandler(){
        this.hp -= 20;
        this.speed *= 2;

        // Fires 2 events, not that great tbh...but works:
        // this.registry.set('hp', this.hp);
        // this.registry.set('speed', this.speed);
        this.registry.set({ hp: this.hp, speed: this.speed });
    }

    update() {}
}
