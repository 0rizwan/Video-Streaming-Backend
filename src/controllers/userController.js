import jwt from 'jsonwebtoken';
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { genAccessAndRefreshTokens } from "../utils/tokens.js";
import { cookieOptions } from '../constants.js';
import { urlencoded } from 'express';

export const registerUser = asyncHandler(async (req, res) => {
    // Fields validation - fields should not be empty
    const { username, email, password, fullname } = req.body
    if (!username || !email || !password || !fullname) {
        throw new ApiError(400, "All fields are required!")
    }

    // Checking if user already exist
    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (userExists) {
        throw new ApiError(409, "Username or email already exist!")
    }

    // Uploading files to local using multer middleware
    if (!req.files.avatar) {
        throw new ApiError(400, "Avatar is required")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0]?.path;
    }

    // Uploading files to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    // Creating user in mongoDb 
    const user = await User.create({
        username,
        email,
        password,
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    // Returning response of created user
    const { password: _, ...userWithoutPassword } = user.toObject();
    return res.status(201).json(
        new ApiResponse(200, userWithoutPassword, "User created successfully!")
    )
})

export const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid user credentials");
    }
    const { accessToken, refreshToken } = await genAccessAndRefreshTokens(user._id);
    const { password: _, ...userWithoutPassword } = user.toObject();

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: userWithoutPassword, accessToken },
                "User logged In successfully!"
            )
        )
})

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true // it will return a updated data else last data
        }
    )

    return res
        .status(200)
        .clearCookie('accessToken', cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out"));
})

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decodedRefreshToken) {
        throw new ApiError(400, "Refresh token is expired");
    }

    const user = await User.findById(decodedRefreshToken._id);
    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Invalid refresh token");
    }
    const { accessToken, newRefreshToken } = await genAccessAndRefreshTokens(user._id);
    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token has been refreshed")
        );
})

export const changeUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }
    if (confirmPassword !== "") {
        if (newPassword !== confirmPassword) {
            throw new ApiError("New and confirm passwords do not match");
        }
    }
    user.password = newPassword;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed"));
})

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched"))
})

export const updateUserAccount = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname && !email) {
        throw new ApiError(400, "Some fields are missing")
    }

    const fieldsToUpdate = {};
    if (fullname) fieldsToUpdate.fullname;
    if (email) fieldsToUpdate.email;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        // {
        //     $set: {
        //         //  db fullname : new fullname given by user to update the existing fullname
        //         fullname: fullname,
        //         email: email
        //     }
        // },
        // This only updates the fields which is present
        {
            $set: fieldsToUpdate
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated"));
})

export const changeUserAvatar = asyncHandler(async (req, res) => {
    const newAvatarLocalPath = req.file?.path;
    if (!newAvatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }
    const newAvatar = await uploadOnCloudinary(newAvatarLocalPath);
    if (!newAvatar.url) {
        throw new ApiError(400, "Error while uploading avatar to cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: newAvatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated"));
})

export const changeUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image to cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated"));
})

export const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    console.log(req.params, "Params")
    if (!username) {
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                foreignField: "channel",
                localField: "_id",
                as: "subscribersCount"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                foreignField: "subscriber",
                localField: "_id",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribersCount"
                },
                subscribedToChannelCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user._id, "$subscribersCount.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                email: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                isSubscribed: 1,
                subscriberCount: 1,
                subscribedToChannelCount: 1
            }
        }
    ])
    if (!channel.length) {
        throw new ApiError(404, "Channel not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel fetched successfully!"));
})

export const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: req.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "watchHistory",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "owner",
                            as: "owner",
                            pipeline: [ //Check this project by writing outside also
                                {
                                    $project: {
                                        username: 1,
                                        fullname: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        } // Here 
                    }
                ]
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully!"));
})



