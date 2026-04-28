import { Character } from "../data/characters.js";
import { Skill } from "../data/skills.js";

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

/**
 * Iterates through all entries in the team and adds all of their assets (portrait + skill icons) to the load queue.
 * @param {Phaser.Scene} scene The current Phaser scene object
 * @param {Array.<Character>} team The array of Character objects
 */
export function queueTeamImages(scene, team){
    team.forEach(member => {
        const portrait = member.portrait;
        const portraitPath = member.getPortraitPath();
        addImgToLoadQueue(scene, portrait, portraitPath);
        // Also queue their skills:
        const skills = member.skills;
        queueHeroSkillsImages(scene, skills);
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPER FUNCTIONS:

/**
 * Adds an image to the load queue with a key and its relative path.
 * @param {Phaser.Scene} scene The current Phaser scene object 
 * @param {String} imgKey The key to load asset into scene
 * @param {String} imgPath The relative path to the image
 */
function addImgToLoadQueue(scene, imgKey, imgPath){
    scene.load.image(imgKey, imgPath);
}

/**
 * Iterates through all Skill entries and adds their icons to the load queue.
 * @param {Phaser.Scene} scene The current Phaser scene object
 * @param {Array.<Skill>} skills The array of Skills of a certain Character 
 */
function queueHeroSkillsImages(scene, skills){
    skills.forEach((skill) => {
        const skillIcon = skill.icon;
        const iconpath = skill.getIconPath();
        addImgToLoadQueue(scene, skillIcon, iconpath);
    })
}

// Use this pattern to load multiple assets outside of preload:
// this.load.image('Demon Spawn.jpg', 'assets/portraits/Demon Spawn.jpg');
// this.load.image('Caltraxa.jpg', 'assets/portraits/Caltraxa.jpg');
// this.load.image('Undead General.jpg', 'assets/portraits/Undead General.jpg');
// this.load.image('Royal Guard.jpg', 'assets/portraits/Royal Guard.jpg');
// this.load.once("complete", () => {initBattle(this, stage); advanceToNextTurn(this)});
// this.load.start();