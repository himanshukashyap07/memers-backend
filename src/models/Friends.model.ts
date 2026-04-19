import mongoose, { Document, Schema } from "mongoose";

export interface IFriends extends Document {
    userId: mongoose.Types.ObjectId;
    friendId: mongoose.Types.ObjectId;
    isFriend: boolean;
}

const friendsSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    friendId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isFriend: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Friends = mongoose.model<IFriends>("Friends", friendsSchema);
export default Friends;
