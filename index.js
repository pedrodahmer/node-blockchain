"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
//TRANSACTION CLASS
class Transaction {
    //A TRANSACTION IS MADE OF AN AMOUNT,
    //A SENDER ADRESS AND A RECEIVER ADRESS
    constructor(amount, fromAdress, toAdress) {
        this.amount = amount;
        this.fromAdress = fromAdress;
        this.toAdress = toAdress;
    }
    //THE IMPLEMENTATION OF THIS METHOD IS
    //TO MAKE THE HASH OF TE INFORMATION POSSIBLE
    toString() {
        return JSON.stringify(this);
    }
}
class Block {
    //A BLOCK NEEDS TO HAVE THE DATA OF THE
    //TRASACTION, THE HASH OF THE PREVIOUS BLOCK
    //AND THE CREATION TIMESTAMP
    constructor(prevHash, transaction, timestamp = Date.now(), nonce = Math.round(Math.random() * 999999999)) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.timestamp = timestamp;
        this.nonce = nonce;
    }
    //THIS METHOD CREATES A HASH OF THE DATA CONTAINED
    //INSIDE THE BLOCK USING THE createHash FUNCTION
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash("SHA256");
        hash.update(str).end();
        return hash.digest("hex");
    }
}
class Wallet {
    constructor() {
        const keyPair = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });
        this.privateKey = keyPair.privateKey.toString();
        this.publicKey = keyPair.publicKey.toString();
    }
    sendMoney(amount, receiverPublicKey) {
        const transaction = new Transaction(amount, this.publicKey, receiverPublicKey);
        const sign = crypto.createSign("SHA256");
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
class Chain {
    constructor() {
        this.chain = new Array();
        //DEFINING THE GENESIS BLOCK
        this.chain = [new Block(null, new Transaction(100, "genesis", "satoshi"))];
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    addBlock(transaction, senderPublicKey, signature) {
        const verifier = crypto.createVerify("SHA256");
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
    mine(nonce) {
        let solution = 1;
        console.log("mining...");
        while (true) {
            const hash = crypto.createHash("MD5");
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest("hex");
            if (attempt.substr(0, 4) === "0000") {
                console.log(`Solved ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
}
//SINGLETON INSTANCE TO MAKE SURE THERE IS AN
//INSTANCE OF A CHAIN BEFORE ANYTHING ELSE
Chain.instance = new Chain();
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();
satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);
console.log(Chain.instance);
