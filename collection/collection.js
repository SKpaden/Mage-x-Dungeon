import { createHeroFromTemplate, getAllHeroIDs, validateHeroID } from "../data/characters.js";

export class Collection {
    static id = 0;
    constructor(playerID = null){
        if (playerID) this.playerID = playerID;
        else this.playerID = 1;

        this.id = Collection.id;
        Collection.id++;
        this.collection = [];
        this.entryID = 0;
    }

    /**
     * Creates and returns a full collection mainly for testing purposes.
     * @param {int} playerID A player ID whom the full collection will belong to
     * @returns {Collection} A full collection containing every existing hero
     */
    static getFullCollection(playerID = null){
        const newCollection = new Collection(playerID);
        newCollection.addManyToCollection(getAllHeroIDs());
        return newCollection;
    }

    /**
     * Creates and returns a sample collection mainly for testing purposes.
     * @param {int} playerID A player ID whom the sample collection will belong to
     * @returns {Collection} A sample collection with 5 starter heroes
     */
    static getSampleCollection(playerID = null){
        const newCollection = new Collection(playerID);
        const sampleTeam = [1,2,3,4,5];
        newCollection.addManyToCollection(sampleTeam);
        return newCollection;
    }

    /**
     * Adds a list of heroes with the corresponding IDs to a collection.
     * @param {Array.<int>} ids The array of hero IDs to add to a collection
     */
    addManyToCollection(ids){
        ids.forEach(id => {
            this.addToCollection(id);
        });
    }

    /**
     * Adds a hero with the corresponding ID to a collection.
     * @param {int} id The ID of a hero to add to a collection
     */
    addToCollection(id){
        this.collection.push(new CollectionEntry(this.entryID, id, this.id));
        this.entryID++;  // update id counter => stay unique

    }

}


class CollectionEntry {
    constructor(entryID, heroID, collectionID){
        try {
            validateHeroID(heroID);  // does hero with the id exist?

            this.id = entryID;
            this.heroID = heroID;
            this.collectionID = collectionID;
            this.hero = createHeroFromTemplate(heroID);            
            this.createDate = Date.now();
        } catch(error){
            console.error(error);
        }
    }
}