import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    user: {
        type: String,  // CHANGED FROM ObjectId to String to match User model
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    media_type: {
        type: String,
        enum: ['text', 'image', 'video'],
        required: true
    },
    media_url: {
        type: String,
        default: ''
    },
    background_color: {
        type: String,
        default: '#4f46e5'
    },
    views: [{
        type: String,  // CHANGED FROM ObjectId to String
        ref: 'User'
    }],
    expires_at: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        index: { expires: 0 } // TTL index to auto-delete after expiration
    }
}, { 
    timestamps: true 
});

// Index for efficient querying
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expires_at: 1 });

const Story = mongoose.model('Story', storySchema);

export default Story;