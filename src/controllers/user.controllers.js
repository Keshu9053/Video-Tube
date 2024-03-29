import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/users.models.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler(async (req, res) => {
    
    const {username, fullname, email, password} = req.body;

    if([username,fullname, email, password].some( (field) => {
        if(field.trim() === '') throw new ApiError(400, "All fields are required") 
    }));
    
    const existedUser = await User.findOne( {$or : [ username, email ]} );
    if(existedUser) {
        throw new ApiError(409 , "User already exist");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) throw new ApiError(400, "Avatar is required");
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) throw new ApiError(400, "Server is unable to store avatar on cloudinary");

    const user = User.create({
        fullname,
        username : username.toLowercase(),
        password,
        email,
        avatar : avatar.url,
        coverImage : coverImage?.url || ""
    });

    const createdUser = User.findById(user._id).select( " -password -refreshToken ");
    if(!createdUser) throw new ApiError(500 , "Something went wrong while registering the user");

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );
})

export default registerUser;
