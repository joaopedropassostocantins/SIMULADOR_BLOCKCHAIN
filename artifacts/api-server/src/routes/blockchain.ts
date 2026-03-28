import { Router, type IRouter } from "express";
import { blockchain } from "../lib/blockchain";
import {
  MineBlockBody,
  AddTransactionBody,
  SetDifficultyBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/blockchain", (_req, res) => {
  res.json(blockchain.toJSON());
});

router.post("/blockchain/mine", (req, res) => {
  const body = MineBlockBody.parse(req.body);
  const reward = body.reward ?? blockchain.miningReward;
  const block = blockchain.minePendingTransactions(body.minerAddress, reward);
  res.json(block);
});

router.post("/blockchain/transactions", (req, res) => {
  const body = AddTransactionBody.parse(req.body);
  const tx = blockchain.addTransaction(body.sender, body.recipient, body.amount);
  res.status(201).json(tx);
});

router.get("/blockchain/validate", (_req, res) => {
  const result = blockchain.validateChain();
  res.json(result);
});

router.post("/blockchain/reset", (_req, res) => {
  blockchain.reset();
  res.json(blockchain.toJSON());
});

router.put("/blockchain/difficulty", (req, res) => {
  const body = SetDifficultyBody.parse(req.body);
  blockchain.setDifficulty(body.difficulty);
  res.json({
    difficulty: blockchain.difficulty,
    message: `Difficulty set to ${blockchain.difficulty}`,
  });
});

export default router;
