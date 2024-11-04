import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscriptionModel.js";
import mongoose from "mongoose";

export const subscribeToChannel = asyncHandler(async (req, res) => {
    const channelId = new mongoose.Types.ObjectId(`${req.params.channelId}`);
    const isAlreadySubscribed = await Subscription.exists({
        channel: channelId,
        subscriber: req.user._id
    });
    if (isAlreadySubscribed) {
        throw new ApiError(400, "User already subscribed to this channel");
    }
    const channel = await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isSubscribed: true }, "Subscribed to the channel succesfully"));
})

export const unsubscribeToChannel = asyncHandler(async (req, res) => {
    const channelId = new mongoose.Types.ObjectId(`${req.params.channelId}`);
    const isAlreadySubscribed = await Subscription.exists({
        channel: channelId,
        subscriber: req.user._id
    });
    if (!isAlreadySubscribed) {
        throw new ApiError(400, "Channel not subscribed");
    }
    const unsubscribedChannel = await Subscription.findByIdAndDelete(isAlreadySubscribed._id);

    return res
        .status(200)
        .json(new ApiResponse(200, { isSubscribed: false }, "Unsubscribed to the channel succesfully"));
})

export const getAllSubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: req.user._id
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "channel",
                as: "channel",
                // pipeline: [
                //     {
                //         $lookup: {
                //             from: "subscriptions",
                //             foreignField: "channel",
                //             localField: "_id",
                //             as: "subscribersCount"
                //         }
                //     },
                //     {
                //         $addFields: {
                //             subscribers: {
                //                 $size: "$subscribersCount"
                //             }
                //         }
                //     },
                //     {
                //         $project: {
                //             username: 1,
                //             fullname: 1,
                //             avatar: 1,
                //             subscribers: 1
                //         }
                //     }
                // ]
            }
        },
        {
            $unwind: "$channel"
        },
        // {
        //     $group: {
        //         _id: "$channel._id",
        //         username: { $first: "$channel.username" },
        //         fullname: { $first: "$channel.fullname" },
        //         avatar: { $first: "$channel.avatar" },
        //         subscribers: { $sum: 1}
        //     }
        // },
        // {
        //     $project: {
        //         channel: 1,
        //         _id: 0
        //     }
        // }
    ])
    console.log(subscriptions, "Hello")
    return res
        .status(200)
        .json(new ApiResponse(200, subscriptions, "All subscription fetched"))
})

