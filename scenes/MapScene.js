import { getRegistryData, setRegistryData } from "../data/registryData.js";
import { getCompletedStages, getStageLabels, getStages, getUnlockedStages } from "../managers/stageManager.js";
import { createBackBtn, destroyBackBtn } from "../ui/backButton.js";
import { initBg } from "../ui/helpers.js";

export default class MapScene extends Phaser.Scene{
    constructor(){ super({ key: 'map'}); }

    preload(){
        this.load.image('map', 'assets/backgrounds/map.jpg');
    }

    create(){
        const uiStats = {
            confirmFontSize: null,
            // labelFontSize: 30,
            labelFontSize: null,
            labelMargin: 30,
            // nodeRadius: 10,
            nodeRadius: null,
            // Colors:
            confirmBgColor: 0x202020,
            confirmBtnBaseColor: 0x202020,
            confirmBtnHoverColor: 0x282828,
            confirmTextColor: 'white',
            stageBaseColor: 0xFFA500,
            stageCompletedColor: 0x00FF00,
            stageSelectColor: 0xFFFF00,
            stageLockedColor: 0xFF0000,
            // Alphas:
            confirmBgAlpha: 0.7,
        };

        this.bg = initBg(this, 'map');
        setVariableUiStats(this);  // set after bg init

        // Get unlocked/completed stages from stageManager:
        const unlockedStages = getUnlockedStages(this);
        const completedStages = getCompletedStages(this)  || [];
        const stages = getStages();
        const labels = getStageLabels();

        this.shapes = [];
        this.labels = [];
        this.selectedStage = null;

        this.backBtn = createBackBtn(this, 'mainMenu');

        // Put stage displays on map:
        labels.forEach((label, i) => {
            const { x,y } = getXYForCircle(this.bg, label);
            const stageID = stages[i];
            const color = getColor(stageID);
            
            const circle = this.add.circle(x, y, uiStats.nodeRadius, color);
            circle.currentColor = color;  // store start color for tween
            this.shapes.push(circle);
            const stageLabel = this.add.text(x, y - uiStats.labelMargin, label, { fontSize: uiStats.labelFontSize, color: 'red', backgroundColor: 'rgba(0,0,0,0.7)'} ).setOrigin(0.5);
            this.labels.push(stageLabel);
            circle.label = stageLabel;
            circle.stage = stageID;
        })

        // Set stages interactive:
        for (let i = 0; i < this.shapes.length; i++) {
            const shape = this.shapes[i];
            const label = this.labels[i];
            const id = stages[i];
            shape.setInteractive( { useHandCursor: true});
            shape.on('pointerdown', () => {
                if (!unlockedStages.includes(id)) return;

                resetSelectTween(this);
                this.selectTween = getStageSelectTween(this, shape, label);
                selectStage(this, shape);
            });
        }



        // Handler for resize:
        this.resizeHandler = () => {
            this.bg.destroy();
            this.bg = initBg(this, 'map');
            setVariableUiStats(this);  // set after bg init

            this.children.sendToBack(this.bg);

            repositionStages(this);
            repositionConfirm(this);
        }

        // Responsive design:
        this.scale.on('resize', this.resizeHandler);

        // Cleanup on shutdown:
        this.events.once("shutdown", () => {
            this.scale.off('resize', this.resizeHandler);
            this.resizeHandler = null;  // clear reference
            destroyBackBtn(this);
        });

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // HELPER FUNCTIONS:

        /**
         * Displays confirmation screen at stage selection.
         * @param {MapScene} scene  The current Phaser scene
         * @param {Object} circle   The Phaser cirlce object (contains stage info)
         */
        function displayStageConfirmation(scene, circle){
            const previousContainer = scene.confirmContainer;
            // Cleanup old one if present:
            if (previousContainer){
                previousContainer.destroy();
                scene.confirmContainer = null;
            }
            // Create new one:
            const { x,y } = getConfirmPopupPosition(scene);
            const container = scene.add.container(x, y);
            scene.confirmContainer = container;
            
            // Confirm message:
            const confirmationText = "Start " + circle.label.text + "?";  // Start Stage 1?
            const text = scene.add.text(0, uiStats.confirmTextOffset, confirmationText, {fontSize: uiStats.confirmFontSize, color: uiStats.confirmTextColor}).setOrigin(0.5);
            // Background:
            const background = scene.add.rectangle(0, 0, uiStats.confirmContainerWidth, uiStats.confirmContainerHeight, uiStats.confirmBgColor, uiStats.confirmBgAlpha);
            // Buttons:
            const yesBtn = scene.add.rectangle(uiStats.confirmYesBtnXOffset, uiStats.confirmBtnYOffset, uiStats.confirmBtnWidth, uiStats.confirmBtnHeight, uiStats.confirmBtnBaseColor);
            const noBtn = scene.add.rectangle(uiStats.confirmNoBtnXOffset, uiStats.confirmBtnYOffset, uiStats.confirmBtnWidth, uiStats.confirmBtnHeight, uiStats.confirmBtnBaseColor);
            // Interactive:
            yesBtn.setInteractive({ useHandCursor: true })
                .on('pointerover', () => yesBtn.setFillStyle(uiStats.confirmBtnHoverColor))
                .on('pointerout', () => yesBtn.setFillStyle(uiStats.confirmBtnBaseColor))
                .on('pointerdown', () => {
                    setRegistryData(scene, "selectedStage", circle.stage);
                    // Had to clean this up manually, otherwise runtime error for resize. This is because the scene object does not get destroyed on stop => fields remain:
                    scene.confirmContainer.destroy();
                    scene.confirmContainer = null;

                    scene.scene.start('teamSelect');
                });
            noBtn.setInteractive({useHandCursor: true })
                .on('pointerover', () => noBtn.setFillStyle(uiStats.confirmBtnHoverColor))
                .on('pointerout', () => noBtn.setFillStyle(uiStats.confirmBtnBaseColor))
                .on('pointerdown', () => clearStageSelection(scene));

            const yes = scene.add.text(yesBtn.x, yesBtn.y, "Yes", {fontSize: uiStats.confirmFontSize, color: uiStats.confirmTextColor}).setOrigin(0.5);
            const no = scene.add.text(noBtn.x, noBtn.y, "No", {fontSize: uiStats.confirmFontSize, color: uiStats.confirmTextColor}).setOrigin(0.5);

            container.add([background, text, yesBtn, noBtn, yes, no]);
        }

        /**
         * Gets the color of the stage circle based on whether it is unlocked or completed.
         * @param {int} id  The id of the stage
         * @returns {int}   The color value for the stage circle
         */
        function getColor(id){
            let color;

            const isUnlocked = unlockedStages.includes(id);
            const isCompleted = completedStages.includes(id);
            if (isUnlocked && isCompleted) color = uiStats.stageCompletedColor;
            else if (isUnlocked) color = uiStats.stageBaseColor;
            else color = uiStats.stageLockedColor;

            return color;
        }

        /**
         * Gets the x and y coordinates for the confirm popup for stage selection.
         * @param {MapScene} scene  The current Phaser scene
         * @returns {Object}        The x and y coordinates of the popup after resize.
         */
        function getConfirmPopupPosition(scene){
            return {
                x: scene.bg.x,
                y: scene.bg.y + scene.bg.displayHeight / 3
            }
        }

        /**
         * Gets the "blinking" tween animation for selected stage.
         * @param {MapScene} scene  The current Phaser scene
         * @param {Object} shape    The circle Phaser shape
         * @param {Object} label    The Phaser label object
         * @returns {Object}        The Phaser "blinking" tween
         */
        function getStageSelectTween(scene, shape, label){
            const tween =  scene.tweens.add({
                targets: [shape, label],
                duration: 800,
                alpha: 0.5,
                yoyo: true,  // return to starting state
                ease: 'Sine.easeInOut',
                repeat: -1,
            })

            tween.on('stop', function(tween, targets){
                targets.forEach(target => {
                    target.setAlpha(1);
                })
            }, scene);
            return tween;
        }

        /**
         * Gets x and y coordinates based on stage label. Stages have fixed points on the map.
         * @param {Object} bg       The background map Phaser object
         * @param {String} label    The label of the stage
         * @returns {Object}        The x and y coordinates for the stage display { x: 0, y: 0}
         */
        function getXYForCircle(bg, label){
            switch (label){
                case 'Stage 1':
                    return {x: bg.x - bg.displayWidth / 3.6, y: bg.y - bg.displayHeight / 4.5};
                case 'Stage 2':
                    return {x: bg.x - bg.displayWidth / 14, y: bg.y - bg.displayHeight / 4.7};
                case 'Stage 3':
                    return {x: bg.x - bg.displayWidth / 16, y: bg.y + bg.displayHeight / 10};
                case 'Stage 4':
                    return {x: bg.x + bg.displayWidth / 6.3, y: bg.y + bg.displayHeight / 50};
                case 'Stage 5':
                    return {x: bg.x + bg.displayWidth / 3.7, y: bg.y - bg.displayHeight / 12};
                default:
                    console.error("INVALID STAGE LABEL IN getXYForCircle: " + label);
                    return {x: 0, y: 0};
            }
        }

        /**
         * Clears the stage selection by removing confirmation popup and tween.
         * @param {MapScene} scene  The current Phaser scene 
         */
        function clearStageSelection(scene){
            resetSelectTween(scene);  // destroy tween
            unselectStage(scene);  // restore default color

            const container = scene.confirmContainer;
            // Destroy old confirm container:
            if (container){
                container.destroy();
                scene.confirmContainer = null;
            }
        }

        /**
         * Repositions the confirm popup upon stage selection if it is present.
         * @param {MapScene} scene  The current Phaser scene
         */
        function repositionConfirm(scene){
            const container = scene.confirmContainer;
            if (container){  // is it currently displayed?
                const { x,y } = getConfirmPopupPosition(scene);
                container.x = x;
                container.y = y;
                resizeConfirmBg(scene, container.list[0]);  // update size of background rect

                const text = container.list[1];
                text.setFontSize(uiStats.confirmFontSize);  // update fontsize
                text.y = uiStats.confirmTextOffset;  // adjust offset

                // Buttons:
                const yesBtn = container.list[2];
                const noBtn = container.list[3];
                repositionConfirmBtn(scene, yesBtn, uiStats.confirmYesBtnXOffset);
                repositionConfirmBtn(scene, noBtn, uiStats.confirmNoBtnXOffset);
                // Button texts:
                const yes = container.list[4];
                const no = container.list[5];
                repositionConfirmBtnText(scene, yes, yesBtn);
                repositionConfirmBtnText(scene, no, noBtn);
            }
        }

        /**
         * Resizes the confirm button after resize.
         * @param {MapScene} scene  The current Phaser scene 
         * @param {Object} btn      The Phaser rectangle graphics object
         * @param {int} xOffset     The x offset value
         */
        function repositionConfirmBtn(scene, btn, xOffset){
            btn.displayWidth = uiStats.confirmBtnWidth;
            btn.displayHeight = uiStats.confirmBtnHeight;
            btn.x = xOffset;
            btn.y = uiStats.confirmBtnYOffset;
        }

        /**
         * Repositions and resizes the confirm button texts after resize.
         * @param {MapScene} scene  The current Phaser scene
         * @param {Object} textObj  The Phaser text object
         * @param {Object} rect     The Phaser rectangle graphics object
         */
        function repositionConfirmBtnText(scene, textObj, rect){
            textObj.x = rect.x;
            textObj.y = rect.y;
            textObj.setFontSize(uiStats.confirmFontSize);
        }

        /**
         * Repositons stages on map after resize.
         * @param {MapScene} scene  The Phaser scene object
         */
        function repositionStages(scene){
            for (let index = 0; index < scene.shapes.length; index++) {
                const shape = scene.shapes[index];
                const labelObject = scene.labels[index];
                const labelText = labelObject.text;
                const { x,y } = getXYForCircle(scene.bg, labelText);
                shape.x = x;
                shape.y = y;
                shape.setRadius(uiStats.nodeRadius);
                labelObject.x = x;
                labelObject.y = y - uiStats.labelMargin;
                labelObject.setFontSize(uiStats.labelFontSize);
            }
        }

        /**
         * Resets the scene's selectTween property.
         * @param {MapScene} scene The current Phaser scene
         */
        function resetSelectTween(scene){
            if (scene.selectTween){
                scene.selectTween.stop();  // trigger 'stop' event to reset alpha to 1
                scene.selectTween.destroy();  // clear memory
                scene.selectTween = null;
            }
        }

        /**
         * Resizes the background rectangle of the confirm popup.
         * @param {MapScene} scene  The current Phaser scene
         * @param {Object} rec      The background rectangle
         */
        function resizeConfirmBg(scene, rec){
            rec.displayWidth = uiStats.confirmContainerWidth;
            rec.displayHeight = uiStats.confirmContainerHeight;
        }

        /**
         * Sets the scene's selectedStage property and resets its color.
         * @param {MapScene} scene  The current Phaser scene
         * @param {Object} shape    The Phaser circle object
         */
        function selectStage(scene, shape){
            unselectStage(scene);

            scene.selectedStage = shape;
            shape.setFillStyle(uiStats.stageSelectColor);

            displayStageConfirmation(scene, shape);
        }

        /**
         * Sets variable uiStats dependent on game size (e.g., fontSize).
         * @param {MapScene} scene  Current Phaser scene object 
         */
        function setVariableUiStats(scene){
            // Node display on map:
            uiStats.labelFontSize = scene.bg.displayHeight / 30;
            uiStats.nodeRadius = scene.bg.displayHeight / 87;

            // Stage confirmation popup:
            uiStats.confirmContainerWidth = scene.bg.displayWidth / 4;
            uiStats.confirmContainerHeight = scene.bg.displayHeight / 6;

            uiStats.confirmFontSize = Math.floor(uiStats.confirmContainerHeight / 6);
            uiStats.confirmTextOffset = - uiStats.confirmContainerHeight / 3;

            // Confirm buttons:
            uiStats.confirmBtnWidth = uiStats.confirmContainerWidth / 3;
            uiStats.confirmBtnHeight = uiStats.confirmContainerHeight / 3;

            uiStats.confirmYesBtnXOffset = -uiStats.confirmContainerWidth / 4;
            uiStats.confirmNoBtnXOffset = uiStats.confirmContainerWidth / 4;
            uiStats.confirmBtnYOffset = uiStats.confirmContainerHeight / 10;
        }

        /**
         * Resets the circle color of a stage display to its default value.
         * @param {MapScene} scene  The current Phaser scene 
         */
        function unselectStage(scene){
            const selected = scene.selectedStage;
            if (selected){
                selected.setFillStyle(selected.currentColor);
            }
        }
    }
}