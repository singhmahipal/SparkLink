import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema({
    from_user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    to_user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted'],
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

connectionSchema.index({ from_user_id: 1, to_user_id: 1 });
connectionSchema.index({ to_user_id: 1, status: 1 });
connectionSchema.index({ from_user_id: 1, created_at: -1 });  

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;