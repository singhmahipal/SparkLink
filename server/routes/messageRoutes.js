import express from 'express';
import { getChatMessages, sendMessage, sseController, getUserRecentMessages } from '../controllers/messageController.js';
import { uploadMessageImage } from '../configs/multer.js'; 
import { protect } from '../middlewares/auth.js';

const messageRouter = express.Router();

messageRouter.get('/:userId', sseController);
messageRouter.post('/send', uploadMessageImage.single('image'), protect, sendMessage); 
messageRouter.post('/get', protect, getChatMessages);
messageRouter.get('/recent-messages', protect, getUserRecentMessages);

export default messageRouter;