import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/users.models.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import ApiResponse from '../utils/ApiResponse.js';
import  jwt  from 'jsonwebtoken';

const   generateAccessTokenAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refershToken = await user.generateRefreshToken();
        
        user.refreshToken = refershToken;
        await user.save( { validateBeforeSave : false } );
        return {accessToken, refershToken};
    } catch (error) {
        throw new ApiError(500, " Something went wrong while generating the accessToken and refresToken")
    }
}  

const registerUser = asyncHandler(async (req, res) => {

    // fetching data from the request    
    const {username, fullname, email, password} = req.body;

    // Validation 
    if([username,fullname, email, password].some( (field) => {
        if(field?.trim() === '') throw new ApiError(400, "All fields are required") 
    }));

    // User Already existed or not
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

const login = asyncHandler(async (req,res) => {

    // fetching and validation part !!
    const {username,email,password} = req.body;

    if(!username && !email) { 
        throw ApiError(400, "All fields are manadatory")
    }


    // checking user in the db
    const user = await User.findOne( {$or : [{username},{email}]} );
    if(!user) {
        throw new ApiError(404, "User is not exist")
    }

    console.log(user);

     // checking for the password !!
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid) {
        throw new ApiError(401, "Incorrect password")
    }

    // generate the Access token and the refresh token
    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

    // Making Cookies and sending response 
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true
    }
    
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refresToken",refreshToken,options)
    .json(
        new ApiResponse( 201 , { user : loggedInUser,accessToken,refreshToken } ,"Login Successfully")
    )
})

const logout = asyncHandler(async (req,res) => {
    const user = await User.findByIdAndUpdate( 
        req.user._id,
        {
            $unset :
            {
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie('refreshToken', options)
    .json( new ApiResponse(201, {} , "User loggedOut Successfully"))
})

const refersAccessToken = asyncHandler( async( req,res ) => {

    const incomingRefreshToken = req.cookie?.refershToken || req.body.refreshToken;
    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    const decodeToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodeToken._id);
    if(!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if(incomingRefreshToken !== user.refershToken) {
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
        httpOnly: true,
        secure : true
    }

    const {accessToken, newRefershToken} = await generateAccessTokenAndRefreshToken(user._id);

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("responseToken", newRefershToken, options)
    .json( new ApiResponse(
        201,
        {
            accessToken,
            refreshToken : newRefershToken,
        },
        "AccessToken Refreshed"
    ))

})

export  {
    registerUser,
    login,
    logout,
    refersAccessToken
};
