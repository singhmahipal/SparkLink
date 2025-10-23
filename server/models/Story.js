import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    user: {
        type: String,
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
        type: String,
        ref: 'User'
    }],
    expires_at: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)  
    }
}, { 
    timestamps: true 
});

// Add all indexes using schema.index() to avoid duplicates
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); 

const Story = mongoose.model('Story', storySchema);

export default Story;