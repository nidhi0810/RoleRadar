import {registerUser, loginUser} from "../service/authService.js";
import generateToken from "../utils/generateToken.js";

export const register = async (req,res)=>{
    try{
        const {name , email, password} = req.body;
        const user = await registerUser(name,email,password);
        const token = await generateToken(user._id);
        return res.status(201).json({
            message : "User registered successfully",
            user : {
                id : user._id,
                name : user.name,
                email : user.email
            },
            token
        })
    }
    catch(error){
        res.status(400).json({
            message : error.message
        })
    }

}
export const login = async(req,res)=>{
    try{
        const {email, password} = req.body;
        const user = await loginUser(email,password);
        const token = await generateToken(user._id);
        return res.status(200).json({
            message : "You are logged in",
            user : {
                id : user._id,
                name : user.name,
                email : user.email
            },
            token
        })
    }
    catch(error){
        res.status(400).json({
            message : error.message
        })
    }
}