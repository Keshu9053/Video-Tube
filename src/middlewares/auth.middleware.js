import { User } from "../models/users.models";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken"

export const verifyToken = asyncHandler( async(req,_,next) => {

    try {
        const accessToken = req.cookies?.accessToken || req.Header("Authorization")?.replace("Bearer ", "");
        if(!accessToken) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(accessToken , process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findOne(decodedToken?._id).select("-password -refreshToken")
        
        if(!user) {
            throw new ApiError(401,"Invalid Access Token")
        }
        
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})

