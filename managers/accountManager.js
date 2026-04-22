import { Collection } from "../collection/collection.js";
import { getRegistryData, setRegistryData } from "../data/registryData.js";
import { updateStageData } from "./stageManager.js";

export class Account {
    static playerID = 1;
    constructor(userName = "User"){
        this.userName = userName;
        this.playerID = Account.playerID;
        Account.playerID++;
        this.collection = Collection.getStarterCollection(this.playerID);
        // Now, still via registry. Later, manage with account:
        this.unlockedStages = [1];
        this.completedStages = [];
        
        this.shards = 1000;  // for summoning
    }

    /**
     * Gets the Account's Collection object.
     * @returns {Collection} The Account's collection
     */
    getCollection(){
        return this.collection;
    }

    /**
     * Gets the Account's shard count.
     * @returns {int} The Account's shard count
     */
    getShards(){
        return this.shards;
    }

    /**
     * Sets the shard amount in the Account.
     * @param {int} newAmount The new amount of shards
     */
    setShards(newAmount){
        this.shards = newAmount;
    }
}

/**
 * Creates a new Account if no Account exists or retrieves an existing one and returns it.
 * @param {Phaser.Scene} scene The current Phaser scene object
 * @param {String} userName Optional username
 * @returns {Account} The existing or new Account object
 */
export function createOrRetrieveAccount(scene, userName = "User"){
    let account = getRegistryData(scene, 'account') || null;
    if (account) return account;
    else {
        // Init new Account (collection, currency, unlocked stages):
        account = new Account(userName);  // 
        setRegistryData(scene, 'account', account);
        return account;
    }
}


export function updateStageAccountData(scene){
    // maybe do more here later if I have an Account class with a stages field
    updateStageData(scene);
}