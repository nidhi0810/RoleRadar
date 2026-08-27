import Job from "../models/jobs.js";
import User from "../models/user.js";
import { calculateMatchScore } from "./jobMatcher.js";

export const addJob = async (
    userId,
    jobData,
    whatsappMessageId,
    channelId,
    channelName
) => {
    const user = await User.findById(userId);
    const matchScore = await calculateMatchScore(user.profile, jobData);
    const job = await Job.create({
        userId: userId,

        companyName: jobData.companyName,
        role: jobData.role,

        link: jobData.link,
        skillsRequired: jobData.skillsRequired,

        experienceRequired: jobData.experienceRequired,
        salaryRange: jobData.salaryRange,

        registrationEndDate: jobData.registrationEndDate,
        channelId: channelId,
        channelName: channelName,
        matchScore
    });

    return job;
};