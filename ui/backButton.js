/**
 * Creates and returns a back button to go back to the Scene specified by the scene key.
 * @param {Phaser.Scene} scene The current Phaser scene
 * @param {String} sceneKey The target Scene key
 * @returns {Object} The Phaser DOM game object
 */
export function createBackBtn(scene, sceneKey){
    if (scene.backBtn) return scene.backBtn;
    const backBtn = scene.add.dom(0, 0, 'div');
    const node = backBtn.node;
    node.classList = 'global-btn back-btn';
    node.innerHTML = '<span>◄</span>';
    // Event listener:
    node.addEventListener('click', () => {
        scene.scene.start(sceneKey);
    })
    return backBtn;
}

/**
 * Destroys the Scene's back button and clears reference.
 * @param {Phaser.Scene} scene The current Phaser scene object
 */
export function destroyBackBtn(scene){
    scene.backBtn.destroy();
    scene.backBtn = null;
}