import jwt from "jsonwebtoken";
import "dotenv/config";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.get("Authorization");
    if(!authHeader || authHeader.split(" ")[0] !== "Bearer"){
        return res.status(401).json({
            message: "Unauthorized"
        })
    }
    const token = authHeader.split(" ")[1];
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch(error){
                return res.status(401).json({
            message: error.message
        });
    }
};