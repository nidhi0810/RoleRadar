import app from "./src/app.js";
import "dotenv/config"
import connectDB from "./src/config/db.js"

const startServer = async ()=>{
    await connectDB();
    app.listen(process.env.PORT||5000,()=>{
        console.log("Server is running!");
    });
}

startServer();

