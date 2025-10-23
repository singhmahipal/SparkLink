import fs from 'fs';
import imagekit from "../configs/imageKit.js";
import Story from '../models/Story.js';
import User from '../models/User.js';
import { inngest } from '../inngest/index.js';

// Add user story
export const addUserStory = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {content, media_type, background_color} = req.body;
        const media = req.file;
        let media_url = ''; 

        // Upload media to imagekit
        if (media_type === 'image' || media_type === 'video') { 
            if (!media) {
                return res.json({success: false, message: 'Media file is required for image/video stories'});
            }

            const fileBuffer = fs.readFileSync(media.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: media.originalname,
                folder: 'stories'
            });
            
            media_url = response.url;

            // Clean up temp file
            fs.unlinkSync(media.path);
        }

        // Create story
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type, 
            background_color
        });

        // Populate user data
        const populatedStory = await Story.findById(story._id)
            .populate('user', 'full_name profile_picture username');

        // Schedule story deletion after 24 hours
        await inngest.send({
            name: 'app/story.delete',
            data: {storyId: story._id.toString()}
        });

        res.json({success: true, story: populatedStory});
    } catch (error) {
        console.error('Add story error:', error);
        res.json({success: false, message: error.message});
    }
};

// Get user stories
export const getStories = async (req, res) => {
    try {
        const {userId} = req.auth();
        const user = await User.findById(userId);

        if (!user) {
            return res.json({success: false, message: 'User not found'});
        }

        // User connections and followings
        const userIds = [userId, ...(user.connections || []), ...(user.following || [])];

        const stories = await Story.find({
            user: {$in: userIds}, 
            expires_at: {$gt: new Date()} // Only get non-expired stories
        }).populate('user', 'full_name profile_picture username')
          .sort({createdAt: -1});

        res.json({success: true, stories});
    } catch (error) {
        console.error('Get stories error:', error);
        res.json({success: false, message: error.message});
    }
};