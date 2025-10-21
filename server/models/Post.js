import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    user: {
        type: String,  // String, not ObjectId
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    image_urls: [{
        type: String
    }],
    post_type: {
        type: String,
        enum: ['text', 'image', 'text_with_image'],
        required: true
    },
    likes_count: [{
        type: String,  // String, not ObjectId
        ref: 'User'
    }],
    comments: [{
        user: {
            type: String,  // String, not ObjectId
            ref: 'User'
        },
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { 
    timestamps: true 
});

postSchema.index({ user: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;