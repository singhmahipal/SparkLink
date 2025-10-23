import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    from_user_id: {type: String, ref: 'User', required: true},
    to_user_id: {type: String, ref: 'User', required: true},
    text: {type: String, trim: true},
    message_type: {type: String, enum: ['text', 'image']},
    media_url: {type: String},
    seen: {type: Boolean, default: false},
}, {timestamps: true, minimize: false});

// ADDED: Indexes for better query performance
messageSchema.index({ from_user_id: 1, to_user_id: 1, createdAt: -1 });
messageSchema.index({ to_user_id: 1, seen: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;