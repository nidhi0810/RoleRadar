import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { postJob } from "../controller/messageController.js";
const router  = express.Router();

router.post("/", authMiddleware,  postJob);

export default router;