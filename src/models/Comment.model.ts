import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
    userId: mongoose.Types.ObjectId;
    postId: mongoose.Types.ObjectId;
    comment: string;
}

const commentSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    comment: {
        type: String,
        required: [true, "Comment text is required"],
        maxlength: [250, "Comment cannot exceed 250 words (characters)"] // Using characters as a proxy for words for simplicity, or can be changed to word count validation
    }
}, { timestamps: true });

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;
