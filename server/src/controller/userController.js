import User from "../models/user.js";

export const getProfile = async(req,res)=>{
    try{
        const userId = req.userId;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message : "Not Found"
            })
        }
        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profile: user.profile
            }
        });
    }
    catch(error){
        res.status(400).json({
            message : error.message
        })
    }

}

export const updateProfile = async(req,res)=>{
    try{
        const {preferredRoles , skills , experience , minSalary} = req.body;
        const userId = req.userId;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message : "Not Found"
            })
        }
        if(preferredRoles !== undefined) user.profile.preferredRoles = preferredRoles;
        
        if(skills !== undefined) user.profile.skills = skills;
        
        if(experience !== undefined) user.profile.experience = experience;
        
        if(minSalary !== undefined) user.profile.minSalary = minSalary;
        
        await user.save();

        return res.status(200).json({
            "message": "Profile updated successfully",
            "profile": { 
                preferredRoles : user.profile.preferredRoles,
                skills : user.profile.skills,
                experience : user.profile.experience,
                minSalary : user.profile.minSalary
            }
        })
    }
    catch(error){
        res.status(500).json({
            message : error.message
        })
    }
}