import { Collection } from "../collection/collection.js";
import { getRegistryData, setRegistryData } from "../data/registryData.js";

export default class TeamSelectScene extends Phaser.Scene{
    constructor() { super({key: 'teamSelect'}); }

    preload() {}

    create() {
        const uiStats = {
            collectionWidth: '85%',
            collectionHeight: '50%',
            selectedWidth: '55%',
            selectedHeight: '30%',
            titleFontSize: null,
            titleOffset: null,
            // Colors:
            backBtnColor: 0x252525,
            backBtnHoverColor: 0x2f2f2f,
            cameraBgColor: 'rgb(20,20,20)',
            collectionBgColor: 'gray',
            titleColor: 'white',
        }

        // const newCollection = Collection.getSampleCollection();
        const newCollection = Collection.getFullCollection();
        const fallbackBaseCollection = newCollection.collection;

        // Get collected heroes data:
        const collection = getRegistryData(this, 'collection') || fallbackBaseCollection;  // fallback to base heroes for now
        const teamLimit = getRegistryData(this, 'teamLimit') || 5;  // default 5 team members, probably won't change

        // Init tracking variables:
        let selectedTeam = [];
        let selected = 0;

        this.cameras.main.setBackgroundColor(uiStats.cameraBgColor);  // set background color of scene

        setVariableUiStats(this);

        this.title = this.add.text(this.scale.width / 2, uiStats.titleOffset, "Select Your Team",
                                   {fontSize: uiStats.titleFontSize, color: uiStats.titleColor}).setOrigin(0.5);

        // Button to go back to stage selector:
        this.backBtn = this.add.rectangle(uiStats.titleFontSize, uiStats.titleFontSize / 2  + uiStats.margin, uiStats.titleFontSize, uiStats.titleFontSize, uiStats.backBtnColor);
        setBackBtnInteractive(this, this.backBtn);

        this.backText = this.add.text(uiStats.titleFontSize, uiStats.titleFontSize / 2  + uiStats.margin, "◄", {fontSize: uiStats.titleFontSize, color: uiStats.titleColor}).setOrigin(0.5);
        
        // Hero display:
        let styleString = `background-color: ${uiStats.collectionBgColor}; width: ${uiStats.collectionWidth}; height: ${uiStats.collectionHeight};`;
        const heroCollection = this.add.dom(this.scale.width / 2, uiStats.titleFontSize + uiStats.margin + this.scale.height / 4, 'div', styleString);  // TODO
        const domElement = heroCollection.node;  
        
        // Current selection:
        styleString =  `background-color: ${uiStats.collectionBgColor}; width: ${uiStats.selectedWidth}; height: ${uiStats.selectedHeight};`;
        const selectedTeamObject = this.add.dom(this.scale.width / 2, this.scale.height - this.scale.height * 0.15 - uiStats.margin, 'div', styleString);
        const selectedDOM = selectedTeamObject.node;
        selectedDOM.id = 'selected-team-container';
        this.selectedDOM = selectedDOM;
        
        populateHeroCollection(domElement, collection, selectedDOM);

        // Start battle button:
        styleString = 'width: 10%; height: 10%';
        const btnX = (this.scale.width + (selectedTeamObject.x + selectedTeamObject.displayWidth / 2)) / 2;
        const battleBtn = this.add.dom(btnX, selectedTeamObject.y, 'div', styleString);
        const btn = document.createElement("button");
        btn.disabled = true;
        btn.innerHTML = "<span>Battle ►</span>";
        btn.id = 'team-select-battle-btn';
        const batteBtnDOM = battleBtn.node;
        batteBtnDOM.id = 'team-select-battle-btn-container';
        batteBtnDOM.append(btn);

        btn.addEventListener('click', () => {
            setRegistryData(this, 'playerTeam', saveSelection(selectedTeam, collection));  // save seleced team.
            this.scene.start('battle');  // render battle scene
        });



        // Handler for resize:
        this.resizeHandler = () => {
            setVariableUiStats(this);  // set after bg init

            this.title.x = this.scale.width / 2;
            this.title.y = uiStats.titleOffset;
            this.title.setFontSize(uiStats.titleFontSize);

            // Back btn:
            this.backBtn.x = uiStats.titleFontSize;
            this.backBtn.y = uiStats.titleFontSize / 2 + uiStats.margin;
            this.backBtn.displayWidth = uiStats.titleFontSize;
            this.backBtn.displayHeight = uiStats.titleFontSize;

            // Back btn text:
            this.backText.setFontSize(uiStats.titleFontSize);
            this.backText.x = uiStats.titleFontSize;
            this.backText.y = uiStats.titleFontSize / 2 + uiStats.margin;
        }

        // Responsive design:
        this.scale.on('resize', this.resizeHandler);

        // Cleanup on shutdown:
        this.events.once("shutdown", () => {
            this.scale.off('resize', this.resizeHandler);
            this.resizeHandler = null;  // clear reference
        });


        /**
         * Adds a click event listener to all elements in array responsible for selecting and unselecting heroes for battle.
         * @param {Array} elements Array of DOM elements that are the portraits inside the collection
         */
        function addEventListeners(elements){
            elements.forEach(element => {
                element.addEventListener('click', () => {
                    const classList = element.classList;
                    if (Array.from(classList).includes('selected')) {  // already selected?
                        // ...then unselect:
                        const i = Number(element.dataset.index);
                        const toBeRemoved = selectedDOM.querySelector(`[data-index="${i}"]`);
                        removeSelectedHero(toBeRemoved, element, i);

                    } else {  // otherwise add class for border
                        if (selected < teamLimit){
                            element.classList.add('selected');  // for CSS styling
                            const i = Number(element.dataset.index);
                            const hero = collection[i].hero;  // lookup has index in collection
                            const portraitPath = hero.getPortraitPath();
                            const elem = document.createElement("div");
                            elem.classList = 'selected-team-member';
                            elem.dataset.index = `${i}`;
                            elem.innerHTML = `<img class="collection-select-img" src="${portraitPath}" alt="Portrait">`;

                            selectedDOM.append(elem);
                            elem.addEventListener('click', () => removeSelectedHero(elem, element, i));
                            selected++;
                            selectedTeam.push(i);

                            const btn = document.getElementById('team-select-battle-btn');
                            if (btn.disabled) {
                                btn.disabled = false;
                                btn.classList = 'active';
                            }
                        }
                    }

                });
            });
        }

        /**
         * Creates a new div-element that contains the hero image and appends it to the collection DOM to display hero collection.
         * @param {Object} dom          The parent DOM element to append the new element to
         * @param {String} portraitPath The portrait image path relative to server root
         * @param {int} index           The index of the hero within the collection array to add to DOM dataset
         */
        function createCollectionHeroDOM(dom, portraitPath, index){
            const elem = document.createElement("div");
            elem.classList = 'collection-select-hero';
            elem.innerHTML = `<img class="collection-select-img" src="${portraitPath}" alt="Portrait" data-index="${index}">`;
            dom.append(elem);
        }

        /**
         * Disables the battle button by setting the disabled property and clearing its classList.
         */
        function disableBattleBtn(){
            const btn = document.getElementById('team-select-battle-btn');
            btn.disabled = true;
            btn.classList = '';
        }

        /**
         * Dsiplays all heroes from the player's collection and registers event listeners for each one.
         * @param {Object} dom The DOM object containing the hero collection display
         * @param {Array} collection The array containing the player's current hero collection
         * @param {Object} selectedDOM The DOM element responsible for displaying selected heroes
         */
        function populateHeroCollection(dom, collection, selectedDOM){
            dom.classList = 'collection collection-select';
            
            for (let i = 0; i < collection.length; i++){
                const hero = collection[i].hero;
                const portraitPath = hero.getPortraitPath();
                createCollectionHeroDOM(dom, portraitPath, i);
            }

            const portraits = document.querySelectorAll('.collection-select-img');
            addEventListeners(portraits);
        }

        /**
         * Removes a hero from selection. Removes DOM portrait from selection display and resets border in collection display.
         * @param {Object} domElement The DOM element to be removed containing the hero portrait
         * @param {Object} collectionElement The DOM element inside the collection container
         * @param {int} index The index of the hero in the collection
         */
        function removeSelectedHero(domElement, collectionElement, index){
            collectionElement.classList.remove('selected');  // unselect
            selected--;
            if (!selected) disableBattleBtn();  // disable btn because selection is empty

            // Remove from array:
            selectedTeam = selectedTeam.filter((entry) => {
                return entry == index ? false : true;
            })

            domElement.remove();  // remove portrait container from selection display
        }

        /**
         * Sets the interactivity of the back button.
         * @param {TeamSelectScene} scene   The current Phaser scene object
         * @param {Object} btn              The Phaser rectangle object
         */
        function setBackBtnInteractive(scene, btn){
            btn.setInteractive({ useHandCursor: true});  // show cursor on hover

            btn.on('pointerover', () => btn.setFillStyle(uiStats.backBtnHoverColor))
               .on('pointerout', () => btn.setFillStyle(uiStats.backBtnColor))
               .on('pointerdown', () => scene.scene.start('map'));
        }

        /**
         * Returns an array of CollectionEntries reflecting the selected team.
         * @param {Array.<int>} indexes         Array of indexes for the collection
         * @param {Array.<Object>} collection   Array of CollectionEntries
         * @returns {Array.<Object>}            The selected team
         */
        function saveSelection(indexes, collection){
            const team = [];
            indexes.forEach(index => {
                team.push(collection[index]);
            })
            return team;
        }

        /**
         * Sets variable uiStats dependent on game size (e.g., fontSize).
         * @param {TeamSelectScene} scene  Current Phaser scene object 
         */
        function setVariableUiStats(scene){
            uiStats.titleFontSize = scene.scale.height / 10;
            uiStats.titleOffset = uiStats.titleFontSize / 2;
            uiStats.margin = uiStats.titleFontSize / 4;
        }
    }
}