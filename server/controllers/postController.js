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

        // DEBUG LOGGING
        console.log('📝 Received post request:');
        console.log('- userId:', userId);
        console.log('- content:', content);
        console.log('- post_type:', post_type);
        console.log('- req.body:', req.body);
        console.log('- images count:', images?.length || 0);

        // Validate post_type
        if (!post_type) {
            console.log('❌ Validation failed: post_type missing');
            return res.status(400).json({ 
                success: false, 
                message: 'Post type is required' 
            });
        }

        // Validate content for text-only posts
        if (post_type === 'text' && !content) {
            console.log('❌ Validation failed: content required for text post');
            return res.status(400).json({ 
                success: false, 
                message: 'Content is required for text posts' 
            });
        }

        // Validate images for image posts
        if ((post_type === 'image' || post_type === 'text_with_image') && (!images || images.length === 0)) {
            console.log('❌ Validation failed: images required for image post');
            return res.status(400).json({ 
                success: false, 
                message: 'At least one image is required for image posts' 
            });
        }

        let image_urls = [];

        // Process images if they exist
        if (images && images.length > 0) {
            console.log(`📤 Processing ${images.length} images...`);
            
            try {
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

                            console.log('✅ ImageKit upload success:', response.fileId);

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
                                console.log('🗑️ Deleted temp file:', image.path);
                            } catch (unlinkError) {
                                console.error('⚠️ Error deleting temp file:', unlinkError);
                            }

                            return url;
                        } catch (uploadError) {
                            console.error('❌ Image upload error:', uploadError);
                            // Clean up temp file even if upload fails
                            if (fs.existsSync(image.path)) {
                                fs.unlinkSync(image.path);
                            }
                            throw uploadError;
                        }
                    })
                );
                console.log(`✅ All ${image_urls.length} images uploaded successfully`);
            } catch (uploadError) {
                console.error('❌ Failed to upload images:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload images to ImageKit'
                });
            }
        }

        // Create post
        const newPost = await Post.create({
            user: userId,
            content: content || '', // Allow empty content for image-only posts
            image_urls,
            post_type
        });

        console.log('✅ Post created with ID:', newPost._id);

        // Populate user data for response
        const populatedPost = await Post.findById(newPost._id)
            .populate('user', 'full_name profile_picture username');

        console.log('✅ Post created successfully by:', populatedPost.user?.username);

        res.status(201).json({ 
            success: true, 
            message: "Post created successfully",
            post: populatedPost
        });
    } catch (error) {
        console.error('❌ Add post error:', error);
        
        // Clean up any remaining temp files
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                        console.log('🗑️ Cleaned up temp file:', file.path);
                    }
                } catch (cleanupError) {
                    console.error('⚠️ Cleanup error:', cleanupError);
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
        
        console.log('📖 Fetching feed for user:', userId);
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            console.log('❌ User not found:', userId);
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

        console.log(`🔍 Fetching posts from ${userIds.length} users`);

        // Fetch posts and populate user
        const posts = await Post.find({ user: { $in: userIds } })
            .populate('user', 'full_name profile_picture username')
            .sort({ createdAt: -1 }); 

        console.log(`✅ Found ${posts.length} posts for feed`);

        res.status(200).json({ 
            success: true, 
            posts,
            count: posts.length
        });
    } catch (error) {
        console.error('❌ Get feed posts error:', error);
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

        console.log('👍 Like request - User:', userId, 'Post:', postId);

        // Validation
        if (!postId) {
            console.log('❌ Post ID missing');
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        // Find post
        const post = await Post.findById(postId);
        
        if (!post) {
            console.log('❌ Post not found:', postId);
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
        const userLikedIndex = post.likes_count.findIndex(
            id => id.toString() === userId.toString()
        );

        if (userLikedIndex !== -1) {
            // Unlike: Remove user from likes
            post.likes_count.splice(userLikedIndex, 1);
            await post.save();
            
            console.log('👎 Post unliked');
            
            res.status(200).json({ 
                success: true, 
                message: 'Post unliked',
                liked: false,
                likes_count: post.likes_count
            });
        } else {
            // Like: Add user to likes
            post.likes_count.push(userId);
            await post.save();
            
            console.log('👍 Post liked');
            
            res.status(200).json({ 
                success: true, 
                message: 'Post liked', 
                liked: true,
                likes_count: post.likes_count
            });
        }
    } catch (error) {
        console.error('❌ Like post error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to like/unlike post'
        });
    }
};

// Get user profiles
export const getUserProfiles = async (req, res) => {
    try {
        const { profileId } = req.body;
        
        console.log('👤 Fetching profile for:', profileId);
        
        if (!profileId) {
            console.log('❌ Profile ID missing');
            return res.status(400).json({
                success: false, 
                message: "Profile ID is required"
            });
        }
        
        const profile = await User.findById(profileId);

        if (!profile) {
            console.log('❌ Profile not found:', profileId);
            return res.status(404).json({
                success: false, 
                message: "Profile not found"
            });
        }
        
        const posts = await Post.find({ user: profileId })
            .populate('user', 'full_name profile_picture username')
            .sort({ createdAt: -1 });

        console.log(`✅ Found profile with ${posts.length} posts`);

        res.status(200).json({
            success: true, 
            profile, 
            posts,
            count: posts.length
        });
    } catch (error) {
        console.error('❌ Get user profiles error:', error);
        res.status(500).json({
            success: false, 
            message: error.message || 'Failed to fetch profile'
        });
    }
};