import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiErrorHandler.js";
import { ApiResponse } from "../utils/apiResponseHandler.js";
import Friends from "../models/Friends.model.js";
import { type IUser } from "../models/User.model.js";
import Notification from "../models/Notification.model.js";
import type { Request, Response } from "express";

const createFollow = asyncHandler(async (req: Request, res: Response) => {
    const { friendId } = req.body;
    const user = req.user as IUser;
    const userId = user._id;

    if (userId.toString() === friendId.toString()) {
        throw new apiError(400, "You cannot follow yourself");
    }

    const existingFollow = await Friends.findOne({ 
        //@ts-ignore
        userId, 
        friendId 
    });
    if (existingFollow) {
        throw new apiError(400, "You are already following this user");
    }

    const follow = await Friends.create({
        //@ts-ignore
        userId,
        friendId,
        isFriend: false
    });

    // Create notification
    await Notification.create({
        recipient: friendId,
        sender: userId,
        type: "follow"
    });

    return res.status(201).json(new ApiResponse(201, follow, "Followed successfully"));
});

const getFollowers = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query;
    const user = req.user as IUser;
    const targetUserId = userId || user._id;

    const followers = await Friends.find({
        //@ts-ignore
        friendId: targetUserId
    }).populate("userId", "username email avatar");

    // Check if current user follows each of these followers
    const followersWithStatus = await Promise.all(followers.map(async (f: any) => {
        const isFollowing = !!(await Friends.findOne({
            //@ts-ignore
            userId: user._id,
            friendId: f.userId._id
        }));
        return {
            ...f.toObject(),
            isFollowing
        };
    }));

    return res.status(200).json(new ApiResponse(200, followersWithStatus, "Followers fetched successfully"));
});

const getFollowing = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query;
    const user = req.user as IUser;
    const targetUserId = userId || user._id;

    const following = await Friends.find({
        //@ts-ignore
        userId: targetUserId
    }).populate("friendId", "username email avatar");

    // Check if current user follows each of these accounts (redundant for own following, but useful for others)
    const followingWithStatus = await Promise.all(following.map(async (f: any) => {
        const isFollowing = !!(await Friends.findOne({
            //@ts-ignore
            userId: user._id,
            friendId: f.friendId._id
        }));
        return {
            ...f.toObject(),
            isFollowing
        };
    }));

    return res.status(200).json(new ApiResponse(200, followingWithStatus, "Following list fetched successfully"));
});

const getFriends = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const friends = await Friends.find({
        $or: [
            { userId: user._id, isFriend: true },
            { friendId: user._id, isFriend: true }
        ]
    }).populate("userId friendId", "username email avatar");
    
    return res.status(200).json(new ApiResponse(200, friends, "Friends fetched successfully"));
});

const followBack = asyncHandler(async (req: Request, res: Response) => {
    const { friendId } = req.body; // friendId here is actually the person who followed the current user
    const user = req.user as IUser;
    const userId = user._id;

    const follow = await Friends.findOne({ 
        //@ts-ignore
        userId: friendId, 
        friendId: userId 
    });
    
    if (!follow) {
        throw new apiError(404, "Follow request not found");
    }

    follow.isFriend = true;
    await follow.save();

    // Also create a reciprocal follow if it doesn't exist to mark both as friends
    const reciprocalFollow = await Friends.findOne({ 
        //@ts-ignore
        userId: userId, 
        friendId: friendId 
    });
    if (reciprocalFollow) {
        reciprocalFollow.isFriend = true;
        await reciprocalFollow.save();
    } else {
        await Friends.create({ 
            //@ts-ignore
            userId: userId, 
            friendId: friendId, 
            isFriend: true 
        });
    }
    // Create notification
    await Notification.create({
        recipient: friendId,
        sender: userId,
        type: "follow"
    });

    return res.status(200).json(new ApiResponse(200, follow, "Followed back successfully. You are now friends!"));
});

const unfollowUser = asyncHandler(async (req: Request, res: Response) => {
    const { friendId } = req.body;
    const user = req.user as IUser;
    const userId = user._id;

    await Friends.findOneAndDelete({
        //@ts-ignore
        userId,
        friendId
    });

    return res.status(200).json(new ApiResponse(200, {}, "Unfollowed successfully"));
});

const getAdminAllFriends = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    if (user.role !== "admin") {
        throw new apiError(403, "Access denied");
    }

    const friends = await Friends.find()
        .populate("userId", "username email avatar")
        .populate("friendId", "username email avatar")
        .sort({ createdAt: -1 });
    
    return res.status(200).json(new ApiResponse(200, friends, "All follow records fetched successfully"));
});

export {
    createFollow,
    getFollowers,
    getFollowing,
    getFriends,
    followBack,
    unfollowUser,
    getAdminAllFriends
};
