import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    type: "follow" | "like" | "comment" | "reply";
    postId?: mongoose.Types.ObjectId;
    commentId?: mongoose.Types.ObjectId;
    isRead: boolean;
}

const notificationSchema: Schema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["follow", "like", "comment", "reply"],
        required: true
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post"
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;
