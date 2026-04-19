import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiErrorHandler.js";
import { ApiResponse } from "../utils/apiResponseHandler.js";
import Like from "../models/Like.model.js";
import { type IUser } from "../models/User.model.js";
import type { Request, Response } from "express";

const createLike = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.body;
    const user = req.user as IUser;
    const userId = user._id;

    const existingLike = await Like.findOne({ 
        //@ts-ignore
        userId, 
        postId 
    });
    if (existingLike) {
        throw new apiError(400, "Already liked");
    }

    const like = await Like.create({ 
        //@ts-ignore
        userId, 
        postId 
    });
    return res.status(201).json(new ApiResponse(201, like, "Post liked"));
});

const getAllLikes = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.query;
    if (!postId) {
        throw new apiError(400, "Post ID is required");
    }
    const likes = await Like.find({ 
        //@ts-ignore
        postId 
    }).populate("userId", "username avatar");
    return res.status(200).json(new ApiResponse(200, likes, "Likes fetched successfully"));
});

const toggleLike = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.body;
    const user = req.user as IUser;
    const userId = user._id;

    const existingLike = await Like.findOne({ 
        //@ts-ignore
        userId, 
        postId 
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Unliked successfully"));
    } else {
        await Like.create({ 
            //@ts-ignore
            userId, 
            postId 
        });
        return res.status(200).json(new ApiResponse(200, { liked: true }, "Liked successfully"));
    }
});

const deleteLike = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.body;
    const user = req.user as IUser;
    const userId = user._id;

    const like = await Like.findOneAndDelete({ 
        //@ts-ignore
        userId, 
        postId 
    });
    if (!like) {
        throw new apiError(404, "Like not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Like removed"));
});

export {
    createLike,
    getAllLikes,
    toggleLike,
    deleteLike
};
