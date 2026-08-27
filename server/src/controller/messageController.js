import { processMessage } from "../service/messageService.js";

export const postJob = async (req, res) => {
    try {
        const userId = req.userId;
        const { text, whatsappMessageId, channelId, channelName } = req.body;

        if (!text) {
            return res.status(400).json({
                message: "Message text is required"
            });
        }

        const job = await processMessage(
            userId,
            text,
            whatsappMessageId,
            channelId,
            channelName
        );
        if (!job) {
            return res.status(200).json({
                message: "Message ignored because it is not a job"
            });
        }
        res.status(201).json({
            message: "Job added successfully",
            job
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};