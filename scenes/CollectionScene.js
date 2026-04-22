import { Character } from "../data/characters.js";
import { Skill } from "../data/skills.js";
import { createOrRetrieveAccount } from "../managers/accountManager.js";
import { createBackBtn, destroyBackBtn } from "../ui/backButton.js";
import { createMenuButton, destroyMenu, resizeMenuButton } from "../ui/menu.js";

export default class CollectionScene extends Phaser.Scene {
    constructor(){ super({ key: 'collection' }); }

    preload(){}

    create(){
        const uiStats = {
            // Colors:
            cameraBgColor: 'rgb(20,20,20)',
            // Dimensions:
            menuBtnDims: null,
            // Positioning:
            menuBtnX: null,
            menuBtnY: null,

        }
        // Bookkeeping for JS selecting from collection:
        const variableStats = {
            selectedHeroElement: null,
            selectedHeroSkills: null,
            selectedHeroIndex: 0,
            selectedSkillIndex: 0,
        }
        
        setVariableUiStats(this);
        const account = createOrRetrieveAccount(this);
        const playerCollection = account.getCollection();  // retrieve collection or create full collection for testing

        this.collectionContainer = createCollectionDOM(this, playerCollection.collection);
        this.title = this.add.dom(0, 0, 'h1');
        this.title.node.classList = 'scene-title';
        this.title.node.innerHTML = "Your Collection";

        this.cameras.main.setBackgroundColor(uiStats.cameraBgColor);  // set background color of scene
        this.menuBtn = createMenuButton(this, uiStats.menuBtnX, uiStats.menuBtnY, uiStats.menuBtnDims);
        this.backBtn = createBackBtn(this, 'mainMenu');

        const container = document.getElementById('collection-inspect-skills');
        container.addEventListener('click', (event) => {
            const target = event.target;
            // Is the target one of the images...
            if (target.nodeName === 'IMG') {
                const index = Number(target.dataset.skillIndex);  // get data
                if (variableStats.selectedSkillIndex === index) return;  // already selected!
                selectSkill(index);  // ...then select the skill
            }
        })

        this.resizeHandler = () => {
            setVariableUiStats(this);
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

        /**
         * Adds the collection list to the DOM layout and adds their event listeners for active selection.
         * @param {Array.<CollectionEntry>} collection The array of CollectionEntries
         */
        function addCollectionList(collection){
            const container = document.getElementById('collection-list');  // get the parent element
            // Render all CollectionEntries:
            collection.forEach((entry, index) => {
                const elem = document.createElement('div');
                elem.classList = 'collection-list-entry';
                const hero = entry.hero;
                const portraitPath = hero.getPortraitPath();
                elem.innerHTML = `<img class="collection-list-img ${index === 0 ? "selected" : ""}" src="${portraitPath}" alt="Portrait" data-index="${index}">`;
                container.append(elem);
                index === 0 ? variableStats.selectedHeroElement = elem : '';
                addSelectEventListener(elem, index, hero, portraitPath);
            });
        }

        /**
         * Adds an event listener to the DOM element enabling selecting heroes from the collection to update the inspect display.
         * @param {Object} elem The DOM div element containing the collected hero portrait inside the collection list
         * @param {int} index The index inside the collection array
         * @param {Character} hero The hero belonging to the DOM object
         * @param {String} portraitPath The relative path to the hero's portrait image
         */
        function addSelectEventListener(elem, index, hero, portraitPath){
            elem.addEventListener('click', () => {
                const oldSelection = variableStats.selectedHeroElement;  // what was the old selection?
                if (oldSelection) {
                    if (oldSelection === elem) return;  // skip if same elem again
                    const img = oldSelection.querySelector('img');
                    img.classList.remove('selected');
                }

                const img = elem.querySelector('img');
                img.classList.add('selected');
                // Bookkeeping:
                variableStats.selectedHeroElement = elem;
                variableStats.selectedHeroIndex = index;

                // Update display:
                updateInspectDisplay(hero, portraitPath);
            })
        }

        /**
         * Creates the DOM element that contains all displayed collection items.
         * @param {Phaser.Scene} scene The current Phaser scene object
         * @param {Array.<CollectionEntry>} collection The array of CollectionEntries
         */
        function createCollectionDOM(scene, collection){
            const collectionContainer = scene.add.dom(0, 0, 'div');  // 0,0 when using CSS
            const node = collectionContainer.node;
            node.classList = 'collection-container';
            node.innerHTML = '<div id="collection-list"></div><div id="collection-inspect"></div>';
            addCollectionList(collection);
            if (collection.length){
                createDummyLayout();
                const firstHero = collection[0].hero;
                const portraitPath = firstHero.getPortraitPath();
                updateInspectDisplay(firstHero, portraitPath);
            }
        }

        /**
         * Creates the main dummy layout for the scene. Needed for event listeners and updating display.
         */
        function createDummyLayout(){
            const container = document.getElementById('collection-inspect');
            container.innerHTML = '<div class="collection-inspect-images">' +
                                    `<div id="collection-inspect-portrait"></div>` +
                                    '<div id="collection-inspect-skill-wrapper"><div id="collection-inspect-skills"></div><div id="skill-description"></div></div>' +
                                    '</div>' +
                                    '<div class="collection-inspect-description"><h3>Description</h3><div class="scroll-text-container" id="scroll-text-container"></div></div>' +
                                    '<div class="collection-inspect-tags" id="collection-inspect-tags"></div>';
        }

        /**
         * Gets an HTML substring containing all data about the selected skill.
         * @param {Skill} skill The Skill object holding the needed data
         * @returns {String} The HTML substring with the Skill data
         */
        function getSkillDesciptionElement(skill){
            // Build content:
            const subString = `
                <strong style="color: #88ff88;">${skill.name}</strong><br>
                <span style="color: #aaa;">Cooldown: ${skill.cooldown || 'None'}</span><br>
                <span style="color: #ff8800;">Targets: ${skill.targets}</span><br>
                <br>
                ${skill.description || 'No description yet.'}
            `;
            return subString;
        }

        /**
         * Updates the inspect container display and variableStats to show data of the newly selected skill
         * @param {int} index The index of the selected skill inside of variableStats.selectedHeroSkills
         */
        function selectSkill(index){
            const container = document.getElementById('collection-inspect-skills');
            // CSS classes for styling:
            const oldSelection = container.querySelector('img.selected');
            oldSelection.classList.remove('selected');
            const newContainer = container.querySelector(`[data-skill-index="${index}"]`);
            newContainer.classList.add('selected');

            updateSelectedSkillDescr(variableStats.selectedHeroSkills[index]);
            variableStats.selectedSkillIndex = index;

            updateSelectedSkillDescr(variableStats.selectedHeroSkills[index]);  // update text content
        }

        /**
         * Sets variable uiStats after a resize event.
         * @param {Phaser.Scene} scene The current Phaser scene object
         */
        function setVariableUiStats(scene){
            const w = scene.scale.width;
            const h = scene.scale.height;
            uiStats.menuBtnDims = Math.floor((w + h) / 40);
            const newBtnMargin = Math.floor(uiStats.menuBtnDims * 3/4);
            uiStats.menuBtnX = w - newBtnMargin;
            uiStats.menuBtnY = newBtnMargin;
        }

        /**
         * Updates the description in the inspect container.
         * @param {String} newDescription The new description to display
         */
        function updateDescription(newDescription){
            const container = document.getElementById('scroll-text-container');
            container.innerHTML = newDescription;
        }

        /**
         * Updates the entire display in the inspect container to show correct data about the newly selected hero.
         * @param {Character} hero The newly selected hero
         * @param {String} portraitPath The relative path to the hero's portrait image
         */
        function updateInspectDisplay(hero, portraitPath){
            updatePortrait(portraitPath);
            updateSkills(hero.skills);
            updateDescription(hero.description);
            updateTags(hero.tags);
        }

        /**
         * Updates the displayed portrait in the inspect container.
         * @param {String} portraitPath The relative path to the new portrait
         */
        function updatePortrait(portraitPath){
            const container = document.getElementById('collection-inspect-portrait');
            container.innerHTML = `<img class="collection-inspect-img" src="${portraitPath}" alt="${portraitPath}"></img>`;
        }

        /**
         * Updates the skill description display in the inspect container for a newly selected skill.
         * @param {Skill} newSkill The new skill to get the description from
         */
        function updateSelectedSkillDescr(newSkill){
            const container = document.getElementById('skill-description');
            container.innerHTML = getSkillDesciptionElement(newSkill);
        }

        /**
         * Updates the displayed skill icons in the inspect container and updates the variableStats.
         * @param {Array.<Skill>} newSkills The array of new skills
         */
        function updateSkills(newSkills){
            variableStats.selectedHeroSkills = newSkills;  // bookkeeping
            const container = document.getElementById('collection-inspect-skills');
            // Update with new icons:
            let htmlString = '';
            newSkills.forEach((skill, skillIndex) => {
                htmlString += `<div class="collection-inspect-skill"><img class="collection-inspect-icon ${skillIndex === 0 ? 'selected' : ''}" src="${skill.getIconPath()}" data-skill-index="${skillIndex}"></div>`;
            })
            container.innerHTML = htmlString;
            // Select default skill on change:
            selectSkill(0);
        }

        /**
         * Updates the displayed tags in the inspect container.
         * @param {Array.<String>} newTags The array of new tags
         */
        function updateTags(newTags){
            const container = document.getElementById('collection-inspect-tags');
            let htmlString = '<h3>Tags</h3>';
            newTags.forEach(tag => {
                htmlString += `<span>${tag}</span>`;
            })
            container.innerHTML = htmlString;
        }
    }
}