import { User } from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyToken = asyncHandler( async(req,_,next) => {

    try {
        // console.log(req.cookies);
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        // console.log(accessToken)
        if(!accessToken) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(accessToken , process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        // console.log(user)
        
        if(!user) {
            throw new ApiError(401,"Invalid Access Token")
        }
        
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})

