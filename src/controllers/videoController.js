import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from '../models/videoModel.js';
import { deleteFromCloudinary, deleteMultipleFromCloudinary, getThumbnail, uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

export const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
})

export const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description, isPublished } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    if (!req.files.videoFile) {
        throw new ApiError(400, "Video file is required")
    }
    const videoLocalPath = req.files?.videoFile[0]?.path;
    let thumbnailLocalPath;
    if (Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0]?.path;
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath, "Videos")
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "Thumbnails")

    if (!videoFile) {
        throw new ApiError(400, "Video file is required")
    }

    let generatedThumbnail;
    if (videoFile.public_id && !thumbnailLocalPath) {
        generatedThumbnail = getThumbnail(videoFile.public_id);
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnailLocalPath ? thumbnail.url : generatedThumbnail,
        duration: videoFile.duration,
        isPublished,
        owner: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(201, video, "Video uploaded"))
})

export const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params;
    let videoObjectId = new mongoose.Types.ObjectId(`${videoId}`);
    // owner's subscribers, 
    const video = await Video.aggregate([
        {
            $match: {
                _id: videoObjectId
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            foreignField: "channel",
                            localField: "_id",
                            as: "subscribersCount"
                        }
                    },
                    {
                        $addFields: {
                            subscribers: {
                                $size: "$subscribersCount"
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscribers: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ]);
    console.log(video, "Vidoe")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video details fetched"))
})

export const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params
    const { title, description } = req.body;

    if (!title && !description && !req.file) {
        throw new ApiError(422, "At least one field must be provided");
    }

    let thumbnail;
    if (req.file && req.file.path) {
        thumbnail = await uploadOnCloudinary(req.file.path, "Thumbnails")
    }

    const fieldsToUpdate = {};
    if (title) fieldsToUpdate.title = title;
    if (description) fieldsToUpdate.description = description;
    if (thumbnail) fieldsToUpdate.thumbnail = thumbnail.url;

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $set: fieldsToUpdate }
    )
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    let segments = video.thumbnail.split('/');
    let thumbnailPublicId = segments[segments.length - 1].split('.')[0];
    await deleteFromCloudinary(`Videotube/Thumbnails/${thumbnailPublicId}`, "image");

    const updatedVideo = await Video.findById(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video details updated"))
})

export const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params

    const video = await Video.findByIdAndDelete(videoId);
    console.log(video)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    let videoSegments = video.videoFile.split('/');
    let videoPublicId = videoSegments[videoSegments.length - 1].split('.')[0];

    let segments = video.thumbnail.split('/');
    let thumbnailPublicId = segments[segments.length - 1].split('.')[0];

    await deleteFromCloudinary(`Videotube/Videos/${videoPublicId}`, "video");
    await deleteFromCloudinary(`Videotube/Thumbnails/${thumbnailPublicId}`, "image");

    return res
        .status(200)
        .json(new ApiResponse(204, {}, "Video deleted"));
})

export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Publish status toggled"))
})
