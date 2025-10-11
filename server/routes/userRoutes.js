import express from 'express';
import { protect } from '../middlewares/auth.js';
import { 
    discoverUsers, 
    followUser, 
    getUserData, 
    unfollowUser, 
    updateUserData 
} from '../controllers/userController.js';
import { upload } from '../configs/multer.js';
import User from '../models/User.js';
import { createUserFromClerk, organizeUploadedFiles } from '../utils/userUtils.js';

const userRouter = express.Router();

// Debug route
userRouter.get('/debug', protect, (req, res) => {
    res.json({
        success: true,
        auth: req.auth,
        userId: req.auth?.userId,
        sessionClaims: req.auth?.sessionClaims
    });
});

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

// Get all users (admin/debug)
userRouter.get('/all-users', protect, async (req, res) => {
    try {
        const users = await User.find({}).select('_id username email full_name');
        res.json({ success: true, count: users.length, users });
    } catch (error) {
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
userRouter.post('/test-upload', protect, handleFileUpload, (req, res) => {
    res.json({
        success: true,
        files: req.files,
        body: req.body
    });
});
userRouter.post('/discover', protect, discoverUsers);
userRouter.post('/follow', protect, followUser);
userRouter.post('/unfollow', protect, unfollowUser);

export default userRouter;