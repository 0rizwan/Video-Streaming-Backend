import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscriptionModel.js";


export const subscribeToChannel = asyncHandler(async (req, res) => {
    const { channelId } = req.body;
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
    const { channelId } = req.body;
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

