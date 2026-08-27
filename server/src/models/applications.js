import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true
        },
        resume: {
            key: {
                type: String
            },
            fileName: {
                type: String
            }
        },
        status: {
            type: String,
            enum: [
                "saved",
                "applied",
                "interview",
                "rejected",
                "offer"
            ],
            default: "saved"
        },

        appliedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

const Application = mongoose.model(
    "Application",
    applicationSchema
);

export default Application;