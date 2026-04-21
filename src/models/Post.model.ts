import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
    text: string;
    userId: mongoose.Types.ObjectId;
    url: string;
    hashtags: string[];
    sharesCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const postSchema: Schema = new Schema({
    text: {
        type: String,
        maxlength: [250, "Text cannot exceed 250 characters"],
        trim: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    url: {
        type: String,
        required: [true, "Image URL is required"]
    },
    hashtags: {
        type: [String],
        default: []
    },
    sharesCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Post = mongoose.model<IPost>("Post", postSchema);
export default Post;
