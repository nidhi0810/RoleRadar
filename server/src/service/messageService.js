import { addJob } from "./jobService.js";
import { extractJob } from "./jobExtractor.js";

export const processMessage = async (
    userId,
    text,
    whatsappMessageId,
    channelId,
    channelName
) => {

    console.log("🔥 ABOUT TO CALL EXTRACT JOB");

    const extractedJob = await extractJob(text);

    console.log("🔥 EXTRACT JOB RETURNED:", extractedJob);

    if (!extractedJob.isJob) {
        return null;
    }

    if (!extractedJob.companyName && !extractedJob.role) {
        console.warn("Job detected but missing company and role; skipping save.");
        return null;
    }

    const job = await addJob(
        userId,
        extractedJob,
        whatsappMessageId,
        channelId,
        channelName
    );

    return job;
};