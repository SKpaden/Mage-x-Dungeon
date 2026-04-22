/**
 * Loads an image asset after the preload Scene method.
 * @param {Phaser.Scene} scene The current Phaser scene object
 * @param {String} imgKey The image key string
 * @param {String} imgPath The relative image path
 * @param {Function} callback The callback function executed on load completion
 */
export function loadImage(scene, imgKey, imgPath, callback){
    // This is necessary to load outside of preload() (see: https://docs.phaser.io/phaser/concepts/loader#image):
    scene.load.image(imgKey, imgPath);
    scene.load.once("complete", callback); // add callback of 'complete' event
    scene.load.start();
}