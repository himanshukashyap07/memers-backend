import z from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiErrorHandler.js";
import User, { type IUser } from "../models/User.model.js";
import { ApiResponse } from "../utils/apiResponseHandler.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { sendVerificationEmail } from "../utils/resendEmail.js";
import { uploadOnImageKit } from "../utils/imageKit.js";
import Friends from "../models/Friends.model.js";
import Post from "../models/Post.model.js";
import Comment from "../models/Comment.model.js";
import Like from "../models/Like.model.js";
import Notification from "../models/Notification.model.js";

const genrateAccessAndRefershToken = async (userId: any) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new apiError(404, "user not found in genrate access and refresh token");
        };
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });;
        return { accessToken, refreshToken };
    } catch (error: any) {
        throw new apiError(500, error || "internal server error in genrate access and refresh token");
    };
}

const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    const validateUser = z.object({
        username: z.string().min(3).max(30).toLowerCase().trim(),
        email: z.string().email().toLowerCase().trim(),
        password: z.string().min(6).max(100)
    });
    const validatedData = validateUser.parse({ username, email, password });

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
        throw new apiError(400, "User with this email already exists");
    }

    const verificationToken = await bcrypt.hash(validatedData.email + validatedData.username, 10);

    // Admin check 
    let role: "user" | "admin" = "user";
    if (process.env.ADMIN_EMAIL && validatedData.email === process.env.ADMIN_EMAIL.toLowerCase()) {
        role = "admin";
    }

    const avatarBuffer = req.file?.buffer;
    let avatarUrl = process.env.DEFAULT_AVATAR_URL || "https://via.placeholder.com/150";

    if (avatarBuffer) {
        const uploadResponse = await uploadOnImageKit(avatarBuffer, req.file?.originalname || "avatar.jpg");
        if (uploadResponse) {
            avatarUrl = uploadResponse.url;
        }
    }

    const newUser = new User({
        ...validatedData,
        avatar: avatarUrl,
        verificationToken,
        isVerified: false,
        role
    });

    const savedUser = await newUser.save();
    if (!savedUser) {
        throw new apiError(500, "User registration failed");
    }

    // Send verification email
    await sendVerificationEmail(validatedData.email, validatedData.username, verificationToken);

    const createdUser = await User.findById(savedUser._id).select("-refreshToken -password -verificationToken");

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully. Please check your email for verification."));
})

const verifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, token } = req.body;

    if (!email || !token) {
        throw new apiError(400, "Email and token are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new apiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new apiError(400, "User is already verified");
    }

    const isTokenMatch = await bcrypt.compare(email.toLowerCase() + user.username, token);
    if (!isTokenMatch) {
        throw new apiError(400, "Invalid verification token");
    }

    user.isVerified = true;
    (user as any).verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully. You can now login."));
})


const loginUser = asyncHandler(async (req: Request, res: Response) => {
    console.log("start");

    const { email, password } = req.body;
    const validateUser = z.object({
        email: z.string().email().toLowerCase().trim(),
        password: z.string().min(6).max(100)
    });
    const validatedData = validateUser.parse({ email, password });

    const user = await User.findOne({ email: validatedData.email }).select("+password");
    if (!user) {
        throw new apiError(404, "User does not exist");
    }

    if (!user.isVerified) {
        throw new apiError(403, "Please verify your email before logging in");
    }

    if (user.isBlock) {
        throw new apiError(403, "Your account has been blocked. Please contact admin.");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(validatedData.password);
    if (!isPasswordCorrect) {
        throw new apiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await genrateAccessAndRefershToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const logOutUser = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    await User.findByIdAndUpdate(user._id, {
        $unset: {
            refreshToken: 1
        }
    },
        {
            new: true,
        }
    );
    const options = {
        httpOnly: true,
        secure: true
    };
    // Ensure logs directory exists and append logout entry using absolute path
    const logsDir = path.resolve(process.cwd(), "logs");
    fs.mkdirSync(logsDir, { recursive: true });
    const logoutLogPath = path.join(logsDir, "userLogoutlogs.txt");
    fs.appendFileSync(logoutLogPath, `User Logged Out: Email:${user.email} and Username:${user.username}  at ${new Date().toISOString()}\n`);

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "user logout successfully"));

});
const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    
    const followersCount = await Friends.countDocuments({ friendId: user._id });
    const followingCount = await Friends.countDocuments({ userId: user._id });

    return res.status(200)
        .json(new ApiResponse(200, {
            ...user.toObject(),
            followersCount,
            followingCount
        }, "user fetched successfully"));
});

const updateUserPassword = asyncHandler(async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new apiError(400, "Old and new passwords are required");
    }

    const userContext = req.user as IUser;
    const user = await User.findById(userContext._id).select("+password");
    if (!user) {
        throw new apiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new apiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password updated successfully"));
})

const updateUserAvatar = asyncHandler(async (req: Request, res: Response) => {
    const avatarBuffer = req.file?.buffer;

    if (!avatarBuffer) {
        throw new apiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnImageKit(avatarBuffer, req.file?.originalname || "avatar.jpg");

    if (!avatar) {
        throw new apiError(400, "Error while uploading avatar");
    }

    const userContext = req.user as IUser;
    const user = await User.findByIdAndUpdate(
        userContext._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
})

// Admin Controllers
const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    if (user.role !== "admin") {
        throw new apiError(403, "Access denied. Admin only.");
    }

    const users = await User.find().select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
})

const toggleBlockUser = asyncHandler(async (req: Request, res: Response) => {
    const userContext = req.user as IUser;
    if (userContext.role !== "admin") {
        throw new apiError(403, "Access denied. Admin only.");
    }

    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        throw new apiError(404, "User not found");
    }

    if (user.role === "admin") {
        throw new apiError(400, "Cannot block an admin");
    }

    user.isBlock = !user.isBlock;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, user, `User ${user.isBlock ? "blocked" : "unblocked"} successfully`));
})

const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const userContext = req.user as IUser;
    if (userContext.role !== "admin") {
        throw new apiError(403, "Access denied. Admin only.");
    }

    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        throw new apiError(404, "User not found");
    }

    // Cascade delete associated data
    // 1. Find all posts by this user to cleanup likes/comments on those posts
    const userPosts = await Post.find({ userId });
    const postIds = userPosts.map(p => p._id);

    // 2. Delete all likes and comments ON the user's posts (orphans)
    await Comment.deleteMany({ postId: { $in: postIds } });
    await Like.deleteMany({ postId: { $in: postIds } });

    // 3. Delete user's own generated content
    await Post.deleteMany({ userId });
    await Comment.deleteMany({ userId });
    await Like.deleteMany({ userId });

    // 4. Delete relationships and notifications
    await Friends.deleteMany({ $or: [{ userId }, { friendId: userId }] });
    await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });

    await User.findByIdAndDelete(userId);

    return res.status(200).json(new ApiResponse(200, {}, "User and all associated data deleted successfully"));
})


const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query;

    if (!userId) {
        throw new apiError(400, "User ID is required");
    }

    const user = await User.findById(userId).select("-password -refreshToken -verificationToken");
    if (!user) {
        throw new apiError(404, "User not found");
    }

    const postsCount = await Post.countDocuments({ userId });
    const followersCount = await Friends.countDocuments({ friendId: userId });
    const followingCount = await Friends.countDocuments({ userId });

    const currentUser = req.user as IUser;
    let isFollowing = false;
    let followsMe = false;

    if (currentUser) {
        // Check if current user follows target
        const follow = await Friends.findOne({
            //@ts-ignore
            userId: currentUser._id,
            friendId: userId
        });
        isFollowing = !!follow;

        // Check if target follows current user
        const followMe = await Friends.findOne({
            //@ts-ignore
            userId: userId,
            friendId: currentUser._id
        });
        followsMe = !!followMe;
    }

    return res.status(200).json(new ApiResponse(200, {
        ...user.toObject(),
        postsCount,
        followersCount,
        followingCount,
        isFollowing,
        followsMe
    }, "User profile fetched successfully"));
});

export {
    registerUser,
    verifyUser,
    loginUser,
    logOutUser,
    getCurrentUser,
    updateUserPassword,
    updateUserAvatar,
    getUserProfile,
    getAllUsers,
    toggleBlockUser,
    deleteUser
};