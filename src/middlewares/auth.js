import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authentication")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);
    if (!user) {
        throw new ApiError('Invalid access token');
    }
    req.user = user;
    next();
})