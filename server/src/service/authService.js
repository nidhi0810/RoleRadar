import bcrypt from "bcrypt";
import User from "../models/user.js";

export const registerUser = async (name, email, password)=>{
    const existingUser = await User.findOne({email});
    if(existingUser) {
        throw new Error("User already registered!");
    }
    const passwordHash = await bcrypt.hash(password,12);
    const user = await User.create({
        name,
        email,
        passwordHash
    });
    return user;
}

export const loginUser = async(email,password)=>{
    const user = await User.findOne({email});
    if(!user) throw new Error("Invalid Email!");
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if(!isMatch){
        throw new Error("Password did not match!");
    }
    return user;
}