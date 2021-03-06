import * as crypto from "crypto";

//TRANSACTION CLASS
class Transaction {
  //A TRANSACTION IS MADE OF AN AMOUNT,
  //A SENDER ADRESS AND A RECEIVER ADRESS
  constructor(
    public amount: number,
    public fromAdress: string,
    public toAdress: string
  ) {}

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
  constructor(
    public prevHash: string | null,
    public transaction: Transaction,
    public timestamp: number = Date.now(),
    public nonce: number = Math.round(Math.random() * 999999999)
  ) {}

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
  public publicKey: string;
  public privateKey: string;

  constructor() {
    //GENTERATES A PRIVATEKEY-PUBLICKEY PAIR USING THE rsa
    //INCRIPTATION
    const keyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    this.privateKey = keyPair.privateKey.toString();
    this.publicKey = keyPair.publicKey.toString();
  }

  //SENDS MONEY FROM ONDE WALLET TO THE OTHER
  sendMoney(amount: number, receiverPublicKey: string) {
    const transaction = new Transaction(
      amount,
      this.publicKey,
      receiverPublicKey
    );

    const sign = crypto.createSign("SHA256");
    sign.update(transaction.toString()).end();

    //CREATING A SIGNATURE USING SHA256
    const signature = sign.sign(this.privateKey);
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

class Chain {
  //SINGLETON INSTANCE TO MAKE SURE THERE IS AN
  //INSTANCE OF A CHAIN BEFORE ANYTHING ELSE
  public static instance = new Chain();

  //CRAETING A CHAIN AS AN ARRAY OF BLOCKS
  chain = new Array() as Block[];

  constructor() {
    //DEFINING THE GENESIS BLOCK
    this.chain = [new Block(null, new Transaction(100, "genesis", "satoshi"))];
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(
    transaction: Transaction,
    senderPublicKey: string,
    signature: Buffer
  ) {
    //CREATES A VERIFIER FOR SHA256
    const verifier = crypto.createVerify("SHA256");
    verifier.update(transaction.toString());

    //VALIDATES THE TOKEN USING CRYPTO'S VERIFY
    const isValid = verifier.verify(senderPublicKey, signature);

    //IF TRUE, MINES THE NEW BLOCK AND THEN PUSHES IT TO THE CHAIN
    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, transaction);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }

  //ATTEMPTS TO CREATE A HASH THAT MATCHES THE DIFFICULTY
  //USING 4 ZEROS STATICALLY AS AN EXAMPLE 
  mine(nonce: number) {
    let solution = 1;
    console.log("mining...");

    //REPEATS ATTEMPT UNTIL SUCCESS
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


//EXAMPLE CASE
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);

console.log(Chain.instance);
