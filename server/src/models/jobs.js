import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        "companyName": {
            type : String,
            required : true
        },
        "role": {
            type : String,
            required : true
        },
        "link": {
            type : String
        },
        "skillsRequired": {
            type : [String]
        },
        "minexperienceRequired": {
            type : Number
        },
        experienceRequired: {
            min: {
                type: Number,
                default: 0
            },
            max: {
                type: Number
            }
        },

        salaryRange: {
            min: {
                type: Number
            },
            max: {
                type: Number
            }
        },
        matchScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        channelId: {
            type: String
        },
        
        channelName: {
            type: String
        },
    },
    {
        timestamps :true
    }
)

const Job = mongoose.model("Job", jobSchema);
export default Job;