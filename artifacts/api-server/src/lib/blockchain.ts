import crypto from "crypto";

export interface Transaction {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  timestamp: string;
}

export interface Block {
  index: number;
  timestamp: string;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
  miningTime: number;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function calculateHash(
  index: number,
  timestamp: string,
  transactions: Transaction[],
  previousHash: string,
  nonce: number,
): string {
  return sha256(
    `${index}${timestamp}${JSON.stringify(transactions)}${previousHash}${nonce}`,
  );
}

function mineBlock(
  index: number,
  timestamp: string,
  transactions: Transaction[],
  previousHash: string,
  difficulty: number,
): { hash: string; nonce: number; miningTime: number } {
  const target = "0".repeat(difficulty);
  let nonce = 0;
  const startTime = Date.now();

  let hash = calculateHash(index, timestamp, transactions, previousHash, nonce);
  while (!hash.startsWith(target)) {
    nonce++;
    hash = calculateHash(index, timestamp, transactions, previousHash, nonce);
  }

  const miningTime = (Date.now() - startTime) / 1000;
  return { hash, nonce, miningTime };
}

function createGenesisBlock(difficulty: number): Block {
  const timestamp = new Date().toISOString();
  const { hash, nonce, miningTime } = mineBlock(0, timestamp, [], "0", difficulty);
  return {
    index: 0,
    timestamp,
    transactions: [],
    previousHash: "0",
    hash,
    nonce,
    difficulty,
    miningTime,
  };
}

export class Blockchain {
  public chain: Block[];
  public pendingTransactions: Transaction[];
  public difficulty: number;
  public miningReward: number;

  constructor(difficulty = 2) {
    this.difficulty = difficulty;
    this.miningReward = 50;
    this.chain = [createGenesisBlock(difficulty)];
    this.pendingTransactions = [];
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(sender: string, recipient: string, amount: number): Transaction {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      sender,
      recipient,
      amount,
      timestamp: new Date().toISOString(),
    };
    this.pendingTransactions.push(tx);
    return tx;
  }

  minePendingTransactions(minerAddress: string, reward = this.miningReward): Block {
    const rewardTx: Transaction = {
      id: crypto.randomUUID(),
      sender: "SYSTEM",
      recipient: minerAddress,
      amount: reward,
      timestamp: new Date().toISOString(),
    };

    const txs = [...this.pendingTransactions, rewardTx];
    const previousBlock = this.getLatestBlock();
    const index = previousBlock.index + 1;
    const timestamp = new Date().toISOString();
    const previousHash = previousBlock.hash;

    const { hash, nonce, miningTime } = mineBlock(
      index,
      timestamp,
      txs,
      previousHash,
      this.difficulty,
    );

    const newBlock: Block = {
      index,
      timestamp,
      transactions: txs,
      previousHash,
      hash,
      nonce,
      difficulty: this.difficulty,
      miningTime,
    };

    this.chain.push(newBlock);
    this.pendingTransactions = [];
    return newBlock;
  }

  validateChain(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      const recalculated = calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.transactions,
        currentBlock.previousHash,
        currentBlock.nonce,
      );

      if (currentBlock.hash !== recalculated) {
        errors.push(
          `Block #${currentBlock.index}: hash mismatch. Expected ${recalculated}, got ${currentBlock.hash}`,
        );
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        errors.push(
          `Block #${currentBlock.index}: previousHash does not match block #${previousBlock.index} hash`,
        );
      }

      const target = "0".repeat(currentBlock.difficulty);
      if (!currentBlock.hash.startsWith(target)) {
        errors.push(
          `Block #${currentBlock.index}: hash does not meet difficulty requirement`,
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  reset(): void {
    this.chain = [createGenesisBlock(this.difficulty)];
    this.pendingTransactions = [];
  }

  setDifficulty(difficulty: number): void {
    this.difficulty = Math.max(1, Math.min(6, difficulty));
  }

  toJSON() {
    return {
      chain: this.chain,
      pendingTransactions: this.pendingTransactions,
      difficulty: this.difficulty,
      miningReward: this.miningReward,
    };
  }
}

export const blockchain = new Blockchain(2);
