import express from 'express';
import { uploadPostImages } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';
import { addPost, getFeedPosts, getUserProfiles, likePost } from '../controllers/postController.js';

const postRouter = express.Router();

postRouter.post('/add', uploadPostImages.array('images', 5), protect, addPost); 
postRouter.get('/feed', protect, getFeedPosts);
postRouter.post('/like', protect, likePost);
postRouter.post('/profile', protect, getUserProfiles); 

export default postRouter;