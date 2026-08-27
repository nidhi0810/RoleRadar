import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getProfile , updateProfile} from "../controller/userController.js";

const router = express.Router();

router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
export default router;