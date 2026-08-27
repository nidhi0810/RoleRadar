import Application from "../models/applications.js";
import Job from "../models/jobs.js";
import { uploadResume } from "../service/s3Service.js";

export const createApplication = async (req, res) => {
    try {
        const userId = req.userId;
        const { jobId } = req.body;

        const job = await Job.findOne({
            _id: jobId,
            userId
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        const application = await Application.create({
            userId,
            jobId,
            status: "applied",
            appliedAt: new Date()
        });

        return res.status(201).json({
            message: "Application created successfully",
            application
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};


export const getApplications = async (req, res) => {
    try {
        const userId = req.userId;

        const applications = await Application.find({
            userId
        })
        .populate("jobId")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            applications
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};


export const updateApplicationStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { status } = req.body;

        const application = await Application.findOne({
            _id: id,
            userId
        });

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        application.status = status;

        await application.save();

        return res.status(200).json({
            message: "Application status updated",
            application
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const uploadApplicationResume = async (req, res) => {
    try {

        const userId = req.userId;
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                message: "Resume file is required"
            });
        }

        const application = await Application.findOne({
            _id: id,
            userId
        });

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        const key = await uploadResume(
            req.file,
            userId,
            id
        );

        application.resume = {
            key,
            fileName: req.file.originalname
        };

        await application.save();

        return res.status(200).json({
            message: "Resume uploaded successfully",
            resume: application.resume
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};