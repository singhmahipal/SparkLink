import express from 'express';
import { protect } from '../middlewares/auth.js';
import { 
    acceptConnectionRequest,
    discoverUsers, 
    followUser, 
    getUserConnections, 
    getUserData, 
    sendConnectionRequest, 
    unfollowUser, 
    updateUserData 
} from '../controllers/userController.js';
import { upload } from '../configs/multer.js';
import User from '../models/User.js';
import { createUserFromClerk, organizeUploadedFiles } from '../utils/userUtils.js';
import { getUserProfiles } from '../controllers/postController.js';
import { getUserRecentMessages } from '../controllers/messageController.js';

const userRouter = express.Router();

// Sync user from Clerk
userRouter.post('/sync-from-clerk', protect, async (req, res) => {
    try {
        const { userId } = req.auth;
        
        const existingUser = await User.findById(userId);
        if (existingUser) {
            return res.json({ 
                success: true, 
                message: 'User already synced', 
                user: existingUser 
            });
        }
        
        const newUser = await createUserFromClerk(userId);
        
        res.json({ 
            success: true, 
            message: 'User synced successfully', 
            user: newUser 
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.json({ success: false, message: error.message });
    }
});

// Multer middleware for file uploads
const handleFileUpload = (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            
            const message = err.code === 'LIMIT_FILE_SIZE' 
                ? 'File size too large. Maximum 5MB allowed.'
                : `File upload error: ${err.message}`;
            
            return res.json({ success: false, message });
        }
        
        console.log('Files received:', req.files);
        console.log('Body received:', req.body);
        
        // Organize files into expected structure
        req.files = organizeUploadedFiles(req.files);
        
        next();
    });
};

// User routes
userRouter.get('/data', protect, getUserData);
userRouter.post('/update', protect, handleFileUpload, updateUserData);

userRouter.post('/discover', protect, discoverUsers);
userRouter.post('/follow', protect, followUser);
userRouter.post('/unfollow', protect, unfollowUser);
userRouter.post('/connect', protect, sendConnectionRequest);
userRouter.post('/accept', protect, acceptConnectionRequest);
userRouter.get('/connections', protect, getUserConnections);
userRouter.post("/profiles", getUserProfiles);
userRouter.get('/recent-messages', protect, getUserRecentMessages);

export default userRouter;