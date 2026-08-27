import Job from "../models/jobs.js";

export const getJobs = async (req, res) => {
    try {
        const userId = req.userId;

        const jobs = await Job.find({ userId })
            .sort({ matchScore: -1 });

        return res.status(200).json({
            jobs
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};