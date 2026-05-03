import { Collection } from "../collection/collection.js";
import { getRegistryData, setRegistryData } from "../data/registryData.js";
import { updateStageData } from "./stageManager.js";

export class Account {
    static playerID = 1;
    constructor(userName = "User"){
        this.userName = userName;
        this.playerID = Account.playerID;
        Account.playerID++;
        // this.collection = Collection.getStarterCollection(this.playerID);
        this.collection = Collection.getFullCollection(this.playerID);
        // Now, still via registry. Later, manage with account:
        this.unlockedStages = [1];
        this.completedStages = [];
        this.stageRewardsReceived = [];
        
        this.shards = 1000;  // for summoning
    }

    /**
     * Adds a certain amount of shards to the account.
     * @param {int} amount The amount to add to the shard count
     */
    addShards(amount){
        if (amount > 0) this.shards += amount;
    }

    /**
     * Checks if the Account can get the unique hero stage reward.
     * @param {int} stage The completed stage
     * @returns {boolean} Whether account is eligible for one-time hero reward
     */
    eligibleForHeroReward(stage){
        return !this.stageRewardsReceived.includes(stage);
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
     * Grants the Account the one-time stage rewards (shards + hero).
     * @param {int} stage The completed stage
     * @param {int} shards Amount of shards as stage reward
     * @param {int} heroID Hero ID of rewarded hero
     */
    grantStageRewards(stage, shards, heroID){
        this.addShards(shards);
        this.collection.addToCollection(heroID);
        this.stageRewardsReceived.push(stage);  // prevent duplicate unique stage rewards 
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