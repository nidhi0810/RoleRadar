import express from "express";

import {
    createApplication,
    getApplications,
    updateApplicationStatus,
    uploadApplicationResume
} from "../controller/applicationController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createApplication
);

router.get(
    "/",
    authMiddleware,
    getApplications
);

router.patch(
    "/:id/status",
    authMiddleware,
    updateApplicationStatus
);

router.post(
    "/:id/resume",
    authMiddleware,
    upload.single("resume"),
    uploadApplicationResume
);

export default router;