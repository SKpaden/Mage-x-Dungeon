import { getHeroPortraitWithID, getHeroWithID } from "../data/characters.js";
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
            collectionBgColor: 'gray',
            titleColor: 'white',
        }

        const fallbackBaseHeroes = [{id: 1, createDate: 1}, {id: 2, createDate: 2}, {id: 3, createDate: 3}, {id: 4, createDate: 4}, {id: 5, createDate: 5}];

        // Get collected heroes data:
        // setRegistryData(this, 'collection', [1,2,3]);  // works!
        const collection = getRegistryData(this, 'collection') || fallbackBaseHeroes;  // fallback to base heroes for now
        const teamLimit = getRegistryData(this, 'teamLimit') || 5;  // default 5 team members, probably won't change

        let selectedTeam = [];
        let selected = 0;

        this.cameras.main.setBackgroundColor('rgb(20,20,20)');  // set background color of scene

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
            setRegistryData(this, 'playerTeam', selectedTeam);  // save seleced team.
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
            dom.style.overflowY = "auto";
            // Scrollbar styling
            dom.style.scrollbarWidth = 'thin';
            dom.style.scrollbarColor = 'rgba(25,25,25,0.5) transparent';
            
            for (let i = 0; i < collection.length; i++){
                const id = collection[i].id;
                const createDate = collection[i].createDate;
                const hero = getHeroWithID(id);
                const portraitPath = "assets/portraits/" + hero.portrait;

                const elem = document.createElement("div");
                elem.classList = 'collection-select-hero';

                elem.innerHTML = `<img class="collection-select-img" src="${portraitPath}" alt="Portrait" data-id="${id}-${createDate}">`;
                dom.append(elem);
            }

            const portraits = document.querySelectorAll('.collection-select-img');
            portraits.forEach(element => {
                element.addEventListener('click', () => {
                    const classList = element.classList;
                    if (Array.from(classList).includes('selected')) {  // already selected?
                        element.classList.remove('selected');  // ...then unselect
                        const idString = element.dataset.id;
                        const splits = idString.split('-');
                        const id = Number(splits[0]);
                        const createDate = Number(splits[1]);
                        const toBeRemoved = selectedDOM.querySelector(`[data-id="${idString}"]`);
                        toBeRemoved.remove();
                        selected--;
                        if (!selected) disableBattleBtn();  // disable btn because selection is empty

                        // Remove from array:
                        selectedTeam = selectedTeam.filter((entry) => {
                            return entry.id == id & entry.createDate == createDate ? false : true;
                        })
                    } else {  // otherwise add class for border
                        if (selected < teamLimit){
                            element.classList.add('selected');  // for CSS styling
                            const idString = element.dataset.id;
                            const splits = idString.split('-');
                            const id = Number(splits[0]);
                            const createDate = Number(splits[1]);
                            const portraitPath = "assets/portraits/" + getHeroPortraitWithID(id);
                            const elem = document.createElement("div");
                            elem.classList = 'selected-team-member';
                            elem.dataset.id = `${idString}`;
                            elem.innerHTML = `<img class="collection-select-img" src="${portraitPath}" alt="Portrait">`;

                            elem.addEventListener('click', () => removeSelectedHero(elem, element, id, createDate));

                            selectedDOM.append(elem);
                            selected++;
                            selectedTeam.push({id: id, createDate: createDate});

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
         * Removes a hero from selection. Removes DOM portrait from selection display and resets border in collection display.
         * @param {Object} domElement The DOM element to be removed containing the hero portrait
         * @param {Object} collectionElement The DOM element inside the collection container
         * @param {int} id The id of the hero
         * @param {int} createDate The creation date of the hero
         */
        function removeSelectedHero(domElement, collectionElement, id, createDate){
            collectionElement.classList.remove('selected');  // unselect
            selected--;
            if (!selected) disableBattleBtn();  // disable btn because selection is empty

            // Remove from array:
            selectedTeam = selectedTeam.filter((entry) => {
                return entry.id == id & entry.createDate == createDate ? false : true;
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
         * Sets variable uiStats dependent on game size (e.g., fontSize).
         * @param {TeamSelectScene} scene  Current Phaser scene object 
         */
        function setVariableUiStats(scene){
            uiStats.titleFontSize = scene.scale.height / 10;
            uiStats.titleOffset = uiStats.titleFontSize / 2;
            uiStats.margin = uiStats.titleFontSize / 4;

            // uiStats.collectionWidth = Math.floor(scene.scale.width * 3/4);
            // uiStats.collectionHeight = Math.floor(scene.scale.height / 2);
        }
    }
}