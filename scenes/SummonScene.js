import { createMenuButton } from "../ui/menu.js";

export default class SummonScene extends Phaser.Scene {
    constructor(){ super({ key: 'summon' }); }
    preload(){
        const uiStats = {
            // Colors:
            cameraBgColor: 'rgb(20,20,20)',
            // Dimensions:
            menuBtnDims: null,
            // Positioning:
            menuBtnX: null,
            menuBtnY: null,
        }

        this.title = this.add.dom(0, 0, 'h1');
        this.title.node.classList = 'scene-title';
        this.title.node.innerHTML = "Summon New Heroes";

        this.cameras.main.setBackgroundColor(uiStats.cameraBgColor);  // set background color of scene
        this.menuBtn = createMenuButton(this, 0, 0, 0);
    }
}