import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponseHandler.js";
import Notification from "../models/Notification.model.js";
import { type IUser } from "../models/User.model.js";
import type { Request, Response } from "express";

const getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const notifications = await Notification.find({
        recipient: user._id
    })
    .populate("sender", "username avatar")
    .populate("postId", "url text")
    .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { notificationId } = req.body;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    return res.status(200).json(new ApiResponse(200, {}, "Notification marked as read"));
});

export {
    getNotifications,
    markNotificationAsRead
};
