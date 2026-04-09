import { initBg } from "../ui/helpers.js";

export default class MainMenuScene extends Phaser.Scene {
    constructor(){
        super({key: 'mainMenu'});
    }

    preload(){
        this.load.image('mainMenuBg', 'assets/backgrounds/battlefield.jpg');
    }

    create(){
        const uiStats = {
            titleOptions: {fontSize: 100, color: '#ffffff'},
            btnFillStyle: 0x202020,
            btnColor: 'white',
            btnHoverFillStyle: 0x404040,
            btnFillStyle: 0x202020,
            btnHoverFillStyle: 0x404040,
            btnMargin: 50,
        };

        this.bg = initBg(this, 'mainMenuBg');
        setVariableUiStats(this);
        
        this.title = this.add.text(this.scale.width / 2, 80, "Mage x Dungeon", uiStats.titleOptions).setOrigin(0.5);

        const btnTexts = ['Battle', 'Collection', 'Summon'];
        const btnTargets = ['map', 'collection', 'summon'];

        // Create buttons and texts:
        const btns = [];
        const btnTextObjects = [];
        let x = this.scale.width / 2;
        let yOffset = uiStats.btnHeight + 120;
        for (let i = 0; i < btnTexts.length; i++){
            const btn = this.add.rectangle(x, yOffset, uiStats.btnWidth, uiStats.btnHeight, uiStats.btnFillStyle);
            btn.setInteractive({ useHandCursor: true});
            btn.on('pointerover', () => {
                btn.setFillStyle(uiStats.btnHoverFillStyle);
            })
            .on('pointerout', () => {
                btn.setFillStyle(uiStats.btnFillStyle);
            })
            .on('pointerdown', (pointer) => {
                if (pointer.button === 0){
                    // this.scale.off('resize');
                    this.scene.start(btnTargets[i]);
                }
            })
            
            btns.push(btn);
            btnTextObjects.push(this.add.text(x, yOffset, btnTexts[i], {fontSize: uiStats.btnFontSize, color: uiStats.btnColor}).setOrigin(0.5));
            yOffset += uiStats.btnHeight + uiStats.btnMargin;
        }

        // Handler for resize:
        this.resizeHandler = () => {
            setVariableUiStats(this);
            this.bg.destroy();
            this.bg = initBg(this, 'mainMenuBg');

            this.children.sendToBack(this.bg);
            this.title.x = this.scale.width / 2;

            resizeButtons(this, btns, btnTextObjects);
        }

        // Responsive design:
        this.scale.on('resize', this.resizeHandler);

        // Cleanup on shutdown:
        this.events.once("shutdown", () => {
            this.scale.off('resize', this.resizeHandler);
            this.resizeHandler = null;  // clear reference
        });

        
        // Set variable ui stats, such as font sizes and width.
        function setVariableUiStats(scene){
            const titleFontSize = scene.scale.height / 8;
            uiStats.titleOptions.fontSize = titleFontSize;
            uiStats.btnFontSize = scene.scale.height / 25;
        
            uiStats.btnWidth = scene.scale.width / 4;
            uiStats.btnHeight = scene.scale.height / 10;    
        }

        // Resizes and repositions buttons and their texts.
        function resizeButtons(scene, buttons, texts){
            let x = scene.scale.width / 2;
            let yOffset = uiStats.btnHeight + 120;
            for (let i = 0; i < buttons.length; i++){
                const btn = buttons[i];
                btn.x = x;
                btn.y = yOffset;
                // !!!Important!!! Use displayWidth/displayHeight instead of width/height:
                btn.displayWidth = uiStats.btnWidth;
                btn.displayHeight = uiStats.btnHeight;
                const text = texts[i];
                text.setFontSize(uiStats.btnFontSize);
                text.x = x;
                text.y = yOffset;
                yOffset += uiStats.btnHeight + uiStats.btnMargin;
            }
        }
    }
}
