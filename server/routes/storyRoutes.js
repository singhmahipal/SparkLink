import express from 'express';
import { uploadStoryMedia } from '../configs/multer.js';
import {protect} from '../middlewares/auth.js';
import { addUserStory, getStories } from '../controllers/storyController.js';

const storyRouter = express.Router();

storyRouter.post('/create', uploadStoryMedia.single('media'), protect, addUserStory);
storyRouter.get('/get', protect, getStories);

export default storyRouter;