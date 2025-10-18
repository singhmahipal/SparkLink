import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

// Add post
export const addPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { content, post_type } = req.body;
        const images = req.files;

        // Validation
        if (!content || !post_type) {
            return res.status(400).json({ 
                success: false, 
                message: 'Content and post_type are required' 
            });
        }

        let image_urls = [];

        // Process images if they exist
        if (images && images.length > 0) {
            console.log(`Processing ${images.length} images...`);
            
            image_urls = await Promise.all(
                images.map(async (image) => {
                    try {
                        const fileBuffer = fs.readFileSync(image.path);
                        
                        // Upload to ImageKit
                        const response = await imagekit.upload({
                            file: fileBuffer,
                            fileName: image.originalname,
                            folder: "posts"
                        });

                        console.log('ImageKit upload response:', response.fileId);

                        // Generate optimized URL
                        const url = imagekit.url({
                            path: response.filePath,
                            transformation: [
                                { quality: 'auto' },
                                { format: 'webp' },
                                { width: '1280' }
                            ]
                        });

                        // Clean up temporary file
                        try {
                            fs.unlinkSync(image.path);
                            console.log('Deleted temp file:', image.path);
                        } catch (unlinkError) {
                            console.error('Error deleting temp file:', unlinkError);
                        }

                        return url;
                    } catch (uploadError) {
                        console.error('Image upload error:', uploadError);
                        // Clean up temp file even if upload fails
                        if (fs.existsSync(image.path)) {
                            fs.unlinkSync(image.path);
                        }
                        throw uploadError;
                    }
                })
            );
        }

        // Create post
        const newPost = await Post.create({
            user: userId,
            content,
            image_urls,
            post_type
        });

        // Populate user data for response
        await newPost.populate('user');

        res.status(201).json({ 
            success: true, 
            message: "Post created successfully",
            post: newPost
        });
    } catch (error) {
        console.error('Add post error:', error);
        
        // Clean up any remaining temp files
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError);
                }
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to create post'
        });
    }
};

// Get feed posts
export const getFeedPosts = async (req, res) => {
    try {
        const { userId } = req.auth();
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Get user connections and followings
        const userIds = [
            userId, 
            ...(user.connections || []), 
            ...(user.following || [])
        ];

        // Fetch posts and sort by creation date (newest first)
        const posts = await Post.find({ user: { $in: userIds } })
            .populate('user', 'name profile_pic username') // Populate only needed fields
            .sort({ createdAt: -1 }); 

        res.status(200).json({ 
            success: true, 
            posts,
            count: posts.length
        });
    } catch (error) {
        console.error('Get feed posts error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to fetch posts'
        });
    }
};

// Like/Unlike post
export const likePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.body;

        // Validation
        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        // Find post
        const post = await Post.findById(postId);
        
        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        // Initialize likes_count if it doesn't exist
        if (!post.likes_count) {
            post.likes_count = [];
        }

        // Check if user already liked the post
        // Convert ObjectId to string for comparison
        const userLikedIndex = post.likes_count.findIndex(
            id => id.toString() === userId.toString()
        );

        if (userLikedIndex !== -1) {
            // Unlike: Remove user from likes
            post.likes_count.splice(userLikedIndex, 1);
            await post.save();
            
            res.status(200).json({ 
                success: true, 
                message: 'Post unliked',
                liked: false,
                likes_count: post.likes_count.length
            });
        } else {
            // Like: Add user to likes
            post.likes_count.push(userId);
            await post.save();
            
            res.status(200).json({ 
                success: true, 
                message: 'Post liked', 
                liked: true,
                likes_count: post.likes_count.length
            });
        }
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to like/unlike post'
        });
    }
};

//get user profiles
export const getUserProfiles = async (req, res) => {
    try {
        const {profileId} = req.body;
        const profile = await User.findById(profileId);

        if (!profile) {
            return res.json({success: false, message: "profile not found"});
        }
        const posts = await Post.find({user: profileId}).populate('user');

        res.json({success: true, profile, posts});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}