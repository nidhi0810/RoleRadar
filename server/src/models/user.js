import mongoose  from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name : {
            type : String,
            required : true,
            trim : true
        },
        email : {
            type : String,
            required : true,
            unique : true,
            trim : true
        },
        passwordHash : {
            type : String,
            required : true
        },
        profile : {
            preferredRoles : {
                type : [String],
                default : []
            },
            skills : {
                type : [String],
                default : []
            },
            experience : {
                type : Number,
                default : 0
            },
            minSalary : {
                type : Number,
                default : 0
            }
        }
    },
    {
        timestamps : true
    }
);

const User = mongoose.model("User", userSchema);
export default User;
