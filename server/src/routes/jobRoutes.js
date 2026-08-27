import express from "express";
import { getJobs } from "../controller/jobController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getJobs);

export default router;