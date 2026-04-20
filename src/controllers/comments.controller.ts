import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiErrorHandler.js";
import { ApiResponse } from "../utils/apiResponseHandler.js";
import Comment from "../models/Comment.model.js";
import Post from "../models/Post.model.js";
import Notification from "../models/Notification.model.js";
import { type IUser } from "../models/User.model.js";
import type { Request, Response } from "express";

const createComment = asyncHandler(async (req: Request, res: Response) => {
    const { postId, comment } = req.body;
    const user = req.user as IUser;
    const userId = user._id;

    if (!comment) {
        throw new apiError(400, "Comment text is required");
    }

    const newComment = await Comment.create({
        //@ts-ignore
        userId,
        postId,
        comment
    });

    // Create notification
    const post = await Post.findById(postId);
    if (post && post.userId.toString() !== userId.toString()) {
        await Notification.create({
            recipient: post.userId,
            sender: userId,
            type: "comment",
            postId,
            commentId: newComment._id
        });
    }

    return res.status(201).json(new ApiResponse(201, newComment, "Comment added successfully"));
});

const getAllComment = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.query;
    if (!postId) {
        throw new apiError(400, "Post ID is required");
    }
    const comments = await Comment.find({ postId })
        .populate("userId", "username avatar")
        .sort({ createdAt: -1 });
    
    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const updateComment = asyncHandler(async (req: Request, res: Response) => {
    const { commentId, comment } = req.body;

    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
        throw new apiError(404, "Comment not found");
    }

    const user = req.user as IUser;
    if (existingComment.userId.toString() !== user._id.toString()) {
        throw new apiError(403, "You can only update your own comments");
    }

    existingComment.comment = comment;
    await existingComment.save();

    return res.status(200).json(new ApiResponse(200, existingComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.body;

    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
        throw new apiError(404, "Comment not found");
    }

    const user = req.user as IUser;
    // Allow owner or admin to delete
    if (existingComment.userId.toString() !== user._id.toString() && user.role !== "admin") {
        throw new apiError(403, "Permission denied");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

const getAdminAllComments = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    if (user.role !== "admin") {
        throw new apiError(403, "Access denied");
    }

    const comments = await Comment.find()
        .populate("userId", "username email avatar")
        .populate("postId", "text url")
        .sort({ createdAt: -1 });
    
    return res.status(200).json(new ApiResponse(200, comments, "All comments fetched successfully"));
});

export {
    createComment,
    getAllComment,
    updateComment,
    deleteComment,
    getAdminAllComments
};
