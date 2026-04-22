import { getHeroWithID, getSummonCost, pullHero } from "../data/characters.js";
import { createOrRetrieveAccount } from "../managers/accountManager.js";
import { loadImage } from "../managers/assetManager.js";
import { createBackBtn, destroyBackBtn } from "../ui/backButton.js";
import { createMenuButton, destroyMenu } from "../ui/menu.js";
import { showTextPopup } from "../ui/popups.js";

export default class SummonScene extends Phaser.Scene {
    constructor(){ super({ key: 'summon' }); }
    preload(){
        this.load.image('test_img', 'assets/portraits/Draconoid - Dark Mage.jpg');
    }
    create(){
        const uiStats = {
            // Colors:
            cameraBgColor: 'rgb(20,20,20)',
            summonBtnBaseFill: 0x202020,
            summonBtnHoverFill: 0x282828,
            summonBtnPointerDownFill: 0x353535,
            // Durations:
            shardDisplayTweenDuration: 100,
            textPopupDuration: 3000,
            // Dimensions:
            portraitBaseWidth: 784,
            portraitBaseHeight: 1168,
            portraitWidth: null,
            portraitHeight: null,
            summonBtnWidth: null,
            summonBtnHeight: null,
            // Fontsize:
            qMarkFontSize: null,
            shardDsiplayFontSize: 0,
            summonTextFontSize: 0,
            // Positioning:
            margin: 50,
            portraitX: null,
            portraitY: null,
            summonBtnX: null,
            summonBtnY: null,
        }
        setVariableUiStats(this);

        // Account data:
        const account = createOrRetrieveAccount(this);  // get user
        let shards = account.getShards();  // get currency
        let lastPull = null;  // to prevent duplicates in a row

        this.title = this.add.dom(0, 0, 'h1');
        this.title.node.classList = 'scene-title';
        this.title.node.innerHTML = "Summon Heroes";
        
        this.cameras.main.setBackgroundColor(uiStats.cameraBgColor);  // set background color of scene
        this.menuBtn = createMenuButton(this, 0, 0, 0);
        this.backBtn = createBackBtn(this, 'mainMenu');

        this.portrait = null;

        // Question mark:
        const qMark = this.add.text(uiStats.portraitX, uiStats.portraitY, "?", {fontSize: uiStats.qMarkFontSize}).setOrigin(0.5);
        // "Animated" border:
        const graphics = this.add.graphics({lineStyle: {color: 0xffffff, width: 5}});
        const colors = [  // rarity colors, but currently no rarities exist really
            { r: 0, g: 0, b: 255 },   // blue
            { r: 128, g: 0, b: 128 },   // purple
            // { r: 0, g: 255, b: 0 },   // green
            { r: 255, g: 165, b: 0 }  // orange
        ];
        // Infinite tween for color-changing mystery border:
        this.currentTween = this.tweens.addCounter({
            from: 0,
            to: colors.length-1,
            duration: 2000,
            repeat: -1,
            ease: 'Linear',
            yoyo: true,
            onUpdate: tween => {
                const value = tween.getValue();  // get current tween counter value (between from and to)

                const index = Math.floor(value);
                const nextIndex = (index + 1) % colors.length;

                const t = value - index; // local interpolation (0 → 1)

                const c1 = colors[index];  // current color
                const c2 = colors[nextIndex];  // next color to change to

                const color = Phaser.Display.Color.Interpolate.ColorWithColor(c1, c2, 1, t);

                const newColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

                graphics.clear();
                graphics.lineStyle(5, newColor, 1);
                graphics.strokeRect(uiStats.portraitX - uiStats.portraitWidth / 2, uiStats.portraitY - uiStats.portraitHeight / 2, uiStats.portraitWidth, uiStats.portraitHeight);
            }
        });

        // Button to summon:
        const summonBtn = this.add.rectangle(uiStats.summonBtnX, uiStats.summonBtnY, uiStats.summonBtnWidth, uiStats.summonBtnHeight, uiStats.summonBtnBaseFill);
        setSummonBtnInteractive(this, summonBtn);

        // Texts:
        const summonText = this.add.text(summonBtn.x, summonBtn.y, `Summon\n${getSummonCost()} Shards`, { fontSize: uiStats.summonTextFontSize, align: 'center', padding: {left: 5, top: 5, right: 5, bottom: 5}}).setOrigin(0.5);
        const shardCount = this.add.text(summonBtn.x + summonBtn.displayWidth / 2 + 20, summonBtn.y, `${shards} Shards Left`, { fontSize: uiStats.shardDsiplayFontSize }).setOrigin(0, 0.5);


        // Whenever window size changes:
        this.resizeHandler = () => {
            setVariableUiStats(this);
            // Button:
            resizeButton();
            // Text:
            resizeText(); 
            // Portrait:
            resizePortrait(this);
        }
        
        // For dynamic resizing:
        this.scale.on('resize', this.resizeHandler);

        // Cleanup on shutdown:
        this.events.once("shutdown", () => {
            this.scale.off('resize', this.resizeHandler);
            this.resizeHandler = null;  // clear reference
            this.title.destroy();
            this.title = null;
            // Menu + Back button:
            destroyMenu(this);
            destroyBackBtn(this);
        });

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // SCENE-SPECIFIC FUNCTIONS:

        /**
         * Disables this Scene's summon button and, if desired, changes the button text to an alternative text until reenableButton is called.
         * @param {String|null} altText An alternative text to display on the disabled button
         */
        function disableButton(altText = null){
            summonBtn.removeInteractive();
            if (altText) summonText.setText(altText);
            summonText.setAlpha(0.3);
        }
        
        /**
         * Pulls a hero for the player's collection if the shard amount is sufficient.
         * @param {Phaser.Scene} scene The current Phaser scene object
         */
        function pullShard(scene){
            try{
                const heroID = pullHero(account, shards, lastPull);
                lastPull = heroID;
                shards = account.getShards();  // get currency again
                const hero = getHeroWithID(heroID);
                const heroName = hero.name;
                const portraitPath = hero.getPortraitPath();
                const imgKey = 'portrait_' + heroID;  // unique image key for every portrait
                // Load asset after preload:
                loadImage(scene, imgKey, portraitPath, () => showHero(scene, imgKey, portraitPath, heroName));

                account.getCollection().addToCollection(heroID);
                shardCount.setText(`${shards} Shards Left`);  // update shard display
            } catch (error){  // insufficient shard amount
                disableButton();
                scene.tweens.add({
                    targets: shardCount,
                    scale: '+=0.2',
                    yoyo: true,
                    duration: uiStats.shardDisplayTweenDuration,
                    ease: 'Linear',
                    onStart: function (tween, target, key, current, previous, param) { target[0].setColor('#ff0000'); },
                    onStartParams: [],
                    onComplete: function (tween, target, key, current, previous, param) { target[0].setColor('#ffffff'); reenableButton(); },  // reset color and reactivate button
                    onCompleteParams: [],
                });
            }
        }

        /**
         * Resizes and repositions this Scene's button. Called after a resize event.
         * @param {Phaser.Scene} scene The current Phaser scene object
         */
        function reenableButton(){
            summonBtn.setInteractive({ useHandCursor: true });
            summonText.setText(`Summon\n${getSummonCost()} Shards`);
            summonText.setAlpha(1);
        }

        /**
         * Resizes and repositions this Scene's buttons. Called after a resize event.
         * @param {Phaser.Scene} scene The current Phaser scene object
         */
        function resizeButton(){
            summonBtn.x = uiStats.summonBtnX;
            summonBtn.y = uiStats.summonBtnY;
            summonBtn.displayWidth = uiStats.summonBtnWidth;
            summonBtn.displayHeight = uiStats.summonBtnHeight;
        }

        /**
         * Resizes and repositions this Scene's portrait. Called after a resize event.
         * @param {Phaser.Scene} scene The current Phaser scene object
         */
        function resizePortrait(scene){
            if (scene.portrait){
                scene.portrait.x = uiStats.portraitX;
                scene.portrait.y = uiStats.portraitY;
                scene.portrait.setScale(uiStats.portraitScale);
            }
        }

        /**
         * Resizes and repositions this Scene's text objects. Called after a resize event.
         */
        function resizeText(){
            summonText.setFontSize(uiStats.summonTextFontSize);
            summonText.x = summonBtn.x;
            summonText.y = summonBtn.y;
            summonBtn.displayWidth = summonBtn.displayWidth;
            summonBtn.displayHeight = summonBtn.displayHeight;
            shardCount.setFontSize(uiStats.shardDsiplayFontSize);
            shardCount.x = summonBtn.x + summonBtn.displayWidth / 2 + 20;
            shardCount.y = summonBtn.y;
            // Mystery placeholder display:
            qMark.x = uiStats.portraitX;
            qMark.y = uiStats.portraitY;
            qMark.setFontSize(uiStats.qMarkFontSize);
        }

        /**
         * Sets the summon button interactive by adding event listeners.
         * @param {Phaser.Scene} scene The current Phaser scene object
         * @param {Object} summonBtn The Phaser rectangle game object
         */
        function setSummonBtnInteractive(scene, summonBtn){
            summonBtn.setInteractive({ useHandCursor: true })
                 .on('pointerover', () => summonBtn.setFillStyle(uiStats.summonBtnHoverFill))
                 .on('pointerout', () => summonBtn.setFillStyle(uiStats.summonBtnBaseFill))
                 .on('pointerdown', () => summonBtn.setFillStyle(uiStats.summonBtnPointerDownFill))
                 .on('pointerup', () => {
                    summonBtn.setFillStyle(uiStats.summonBtnBaseFill);
                    pullShard(scene);
                 });
        }

        /**
         * Sets variable uiStats after a resize event.
         * @param {Phaser.Scene} scene The current Phaser scene object
         */
        function setVariableUiStats(scene){
            const sceneHalfWidth = scene.scale.width / 2;
            const sceneHalfHeight = scene.scale.height / 2;
            // Button:
            uiStats.summonBtnWidth = Math.max(scene.scale.width / 5, 300);
            uiStats.summonBtnHeight = scene.scale.height / 10;
            uiStats.summonBtnX = sceneHalfWidth;
            uiStats.summonBtnY = scene.scale.height - uiStats.summonBtnHeight;

            uiStats.margin = uiStats.summonBtnHeight;

            // Text:
            uiStats.qMarkFontSize = scene.scale.height / 4;
            uiStats.summonTextFontSize = Math.floor(scene.scale.height / 20);
            uiStats.shardDsiplayFontSize = uiStats.summonTextFontSize / 2;

            // Portrait:
            uiStats.portraitX = sceneHalfWidth;
            uiStats.portraitY = sceneHalfHeight;
            uiStats.portraitScale = Math.min(scene.scale.width * 3/4 / uiStats.portraitBaseWidth, sceneHalfHeight / uiStats.portraitBaseHeight);  // take smallest scale to fit 3/4 width and 1/2 of height
            uiStats.portraitWidth = uiStats.portraitBaseWidth * uiStats.portraitScale;
            uiStats.portraitHeight = uiStats.portraitBaseHeight * uiStats.portraitScale;
        }

        /**
         * Shows the portrait of the pulled hero with their portrait and a small tween "drop" animation.
         * @param {Phaser.Scene} scene The current Phaser scene object
         * @param {String} imgKey The image key for the portrait
         * @param {String} path The relative path to the portrait
         * @param {String} heroName The hero name
         */
        function showHero(scene, imgKey, path, heroName){
            // Remove border if present:
            scene.currentTween?.destroy();  // stop infinite tween
            graphics.clear();  // remove old border
            
            if (scene.portrait) { scene.portrait.destroy(); scene.portrait = null; }
            disableButton("Summoning...");
            const portrait = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, imgKey).setScale(uiStats.portraitScale);
            scene.portrait = portrait;

            // One-time use tween:
            scene.tweens.add({
                targets: portrait,
                scale: '+=0.2',
                ease: 'Back.easeOut',  // looks best imo
                duration: 200,
                yoyo: true,
                hold: 500,
                onComplete: () => {
                        scene.cameras.main.shake(200, 0.01);
                        showTextPopup(
                            scene,
                            portrait.x,
                            portrait.y - portrait.displayHeight / 2 - summonText.displayHeight,
                            `${heroName} was added to your collection!`, uiStats.textPopupDuration,
                            {fontSize: uiStats.summonTextFontSize}
                        );
                        // Wait a bit to reenable button:
                        scene.time.delayedCall(uiStats.textPopupDuration / 2, () => reenableButton());
                    },
            })
        }
    }
}