import express from 'express';
import { upload, uploadMultiplePostImages } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';
import { addPost, getFeedPosts, likePost } from '../controllers/postController.js';

const postRouter = express.Router();

postRouter.post('/add', protect, uploadMultiplePostImages, addPost);
postRouter.get('/feed', protect, getFeedPosts);
postRouter.post('/like', protect, likePost);

export default postRouter;