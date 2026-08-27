import mongoose, { connect } from "mongoose";
import "dotenv/config";

const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected");
    }
    catch(error){
        console.error("Failed:" , error.message);
        process.exit(1);
    }
}
export default connectDB;