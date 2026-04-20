import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiErrorHandler.js";
import { ApiResponse } from "../utils/apiResponseHandler.js";
import Post from "../models/Post.model.js";
import Like from "../models/Like.model.js";
import Comment from "../models/Comment.model.js";
import { uploadOnImageKit } from "../utils/imageKit.js";
import { type IUser } from "../models/User.model.js";
import type { Request, Response } from "express";

const createPost = asyncHandler(async (req: Request, res: Response) => {
    const { text } = req.body;
    const imageBuffer = req.file?.buffer;

    if (!imageBuffer) {
        throw new apiError(400, "Image is required");
    }

    // Extract hashtags
    const hashtags = text ? text.match(/#[a-z0-9_]+/gi)?.map((tag: string) => tag.slice(1).toLowerCase()) || [] : [];

    const image = await uploadOnImageKit(imageBuffer, req.file?.originalname || "post_image.jpg");

    if (!image) {
        throw new apiError(400, "Error while uploading image to ImageKit");
    }

    const user = req.user as IUser;
    const post = await Post.create({
        text,
        //@ts-ignore
        userId: user._id,
        url: image.url,
        hashtags
    });

    return res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});

const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const posts = await Post.find()
        .populate("userId", "username avatar");

    // Randomize posts (Jumble feed)
    const shuffledPosts = posts.sort(() => Math.random() - 0.5);

    // Add likes and comments count to each post
    const postsWithDetails = await Promise.all(shuffledPosts.map(async (post) => {
        const likesCount = await Like.countDocuments({ postId: post._id });
        const commentsCount = await Comment.countDocuments({ postId: post._id });

        let isLiked = false;
        if (user) {
            const liked = await Like.findOne({
                //@ts-ignore
                postId: post._id,
                userId: user._id
            });
            isLiked = !!liked;
        }

        return {
            ...post.toObject(),
            likesCount,
            commentsCount,
            isLiked
        };
    }));

    return res.status(200).json(new ApiResponse(200, postsWithDetails, "Posts fetched successfully"));
});

const updatePost = asyncHandler(async (req: Request, res: Response) => {
    const { postId, text } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
        throw new apiError(404, "Post not found");
    }

    const user = req.user as IUser;
    // Check ownership
    if (post.userId.toString() !== user._id.toString()) {
        throw new apiError(403, "You can only update your own posts");
    }

    // Update text and hashtags if text is provided
    if (text !== undefined) {
        post.text = text;
        post.hashtags = text.match(/#[a-z0-9_]+/gi)?.map((tag: string) => tag.slice(1).toLowerCase()) || [];
    }

    await post.save();

    return res.status(200).json(new ApiResponse(200, post, "Post updated successfully"));
});

const deletePost = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
        throw new apiError(404, "Post not found");
    }

    const user = req.user as IUser;
    // Check ownership or admin
    if (post.userId.toString() !== user._id.toString() && user.role !== "admin") {
        throw new apiError(403, "You do not have permission to delete this post");
    }

    // Delete associated likes and comments
    await Like.deleteMany({ postId });
    await Comment.deleteMany({ postId });

    await Post.findByIdAndDelete(postId);

    return res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});

const getUserPosts = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query;
    const user = req.user as IUser;
    const targetUserId = userId || user._id;

    const posts = await Post.find({
        //@ts-ignore
        userId: targetUserId
    }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, posts, "User posts fetched successfully"));
});

const getPostsByHashtag = asyncHandler(async (req: Request, res: Response) => {
    const { hashtag } = req.query;
    if (!hashtag) {
        throw new apiError(400, "Hashtag is required");
    }

    const posts = await Post.find({
        hashtags: (hashtag as string).toLowerCase()
    }).populate("userId", "username avatar").sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, posts, `Posts with hashtag #${hashtag} fetched`));
});

export {
    createPost,
    getAllPosts,
    updatePost,
    deletePost,
    getUserPosts,
    getPostsByHashtag
};
