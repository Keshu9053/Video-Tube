import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/users.models.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import ApiResponse from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    
    const {username, fullname, email, password} = req.body;


    if([username,fullname, email, password].some( (field) => {
        if(field.trim() === '') throw new ApiError(400, "All fields are required") 
    }));

    const existedUser = await User.findOne( {$or : [ {username}, {email} ]} );
    if(existedUser) {
        throw new ApiError(409 , "User already exist");
    }


    // Avatar Handling
    const avatarLocalPath = req.files?.avatar[0]?.path;
    if(!avatarLocalPath) throw new ApiError(400, "Avatar is required");
    const avatar = await uploadOnCloudinary(avatarLocalPath);    
    if(!avatar) throw new ApiError(400, "Server is unable to store avatar on cloudinary");


    // CoverImage Handling
    let coverImageLocalPath = req.files?.coverImage?.[0]?.path || '';
    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!coverImage) {
            throw new ApiError(400, "Server is unable to store cover image on Cloudinary");
        }
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    
    if(!createdUser) throw new ApiError(500 , "Something went wrong while registering the user");

    // const userObject = createdUser.toObject();
    console.log(createdUser);

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );
})

export default registerUser;
