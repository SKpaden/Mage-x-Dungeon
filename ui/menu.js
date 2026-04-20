/**
 * Creates the top right menu button to toggle menu and registers event listeners for functionality.
 * @param {Phaser.Scene} scene The current Phaser scene object
 * @param {float} x The x position (not used currently because of CSS)
 * @param {float} y The y position (not used currently because of CSS)
 * @param {float} dims The width/height (not used currently because of CSS)
 * @returns {Object} The Phaser DOM game object
 */
export function createMenuButton(scene, x, y, dims){
    if (scene.menuBtn) return scene.menuBtn;  // should not happen, but a little safer
    const menuBtn = scene.add.dom(0, 0, 'div');
    const node = menuBtn.node;
    node.classList = "top-menu-btn";
    node.innerHTML = '<span>&#8801</span>';  // 
    //menuBtn.node.style.fontSize = `${dims}px`
    // Toggle events:
    node.addEventListener('click', () => toggleMenu(scene));
    const escBtn = scene.input.keyboard.addKey("ESC");
    escBtn.on('down', () => toggleMenu(scene));

    menuBtn.menu = createMenu(scene);
    return menuBtn;
}

/**
 * Destroys the Scene's menu and clears reference.
 * @param {Phaser.Scene} scene The current Phaser scene object
 */
export function destroyMenu(scene){
    scene.menuBtn.destroy();
    scene.menuBtn = null;
}

// Not used now, maybe later:
export function resizeMenuButton(scene, newX, newY, dims, button){
    button.x = newX;
    button.y = newY;
    const node = button.node;
    node.style.fontSize = `${dims}px`
    button.displayWidth = dims;
    button.displayHeight = dims;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

/**
 * Creates the menu with its options from an html string and registers event listeners for it.
 * @param {Phaser.Scene} scene The current Phaser scene object
 * @returns {Object} The Phaser DOM game object
 */
function createMenu(scene){
    const htmlString = 
        '<h3 id="base-menu-title">Menu</h3><div class="base-menu-options">' +
        '<div class="base-menu-option"><button class="base-menu-button" id="mm-option-btn" data-scene="mainMenu">Main Menu</button></div>' +
        '<div class="base-menu-option"><button class="base-menu-button" id="collection-option-btn" data-scene="collection">Collection</button></div>' +
        '<div class="base-menu-option"><button class="base-menu-button" id="map-option-btn" data-scene="map">Map</button></div>' +
        '<div class="base-menu-option"><button class="base-menu-button" id="summon-option-btn" data-scene="summon">Summon</button></div></div>';
    const menu = scene.add.dom(0, 0, 'div');  // use 0,0 when using CSS positioning
    const node = menu.node;
    node.classList = "base-menu hidden";  // hide per default
    node.innerHTML = htmlString;
    registerEvents(scene, node);
    return menu;
}

/**
 * Registers click events for all the menu buttons.
 * @param {Phaser.Scene} scene The current Phaser scene object
 * @param {Object} menu The menu DOM object
 */
function registerEvents(scene, menu){
    const btns = menu.querySelectorAll('.base-menu-button');
    btns.forEach(button => {
        const sceneKey = button.dataset.scene;
        button.addEventListener('click', () => scene.scene.start(sceneKey));
    });
}

/**
 * Toggles the menu display.
 * @param {Phaser.Scene} scene The current Phaser scene object
 */
function toggleMenu(scene){
    const classList = scene.menuBtn.menu.node.classList;
    if (Array.from(classList).includes('hidden')){
        scene.menuBtn.menu.node.classList = "base-menu";
    } else {
        scene.menuBtn.menu.node.classList = "base-menu hidden";
    }
}