import multer from "multer";
import os from "os";
import path from "path";
import fs from "fs";

// Create uploads directory in temp folder
const tempDir = path.join(os.tmpdir(), 'sparklink-uploads');

// Ensure directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('Created temp directory:', tempDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Multer destination - file:', file.fieldname);
        console.log('Temp directory:', tempDir);
        
        // Double check directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        if (!file.originalname) {
            return cb(new Error('File must have an original name'));
        }
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
        
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

// Common image file filter
const imageFileFilter = (req, file, cb) => {
    console.log('File filter check:');
    console.log('- fieldname:', file.fieldname);
    console.log('- originalname:', file.originalname);
    console.log('- mimetype:', file.mimetype);
    
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// ========== USER PROFILE/COVER UPLOAD ==========
const uploadUserConfig = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 2 // Maximum 2 files
    },
    fileFilter: (req, file, cb) => {
        console.log('User upload - fieldname:', file.fieldname);
        
        // Only allow profile and cover for user uploads
        if (!['profile', 'cover'].includes(file.fieldname)) {
            return cb(new Error(`Invalid field name: ${file.fieldname}. Only 'profile' and 'cover' are allowed.`));
        }
        
        imageFileFilter(req, file, cb);
    }
});

// ========== POST IMAGES UPLOAD ==========
const uploadPostConfig = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 5 // Maximum 5 images per post
    },
    fileFilter: (req, file, cb) => {
        console.log('Post upload - fieldname:', file.fieldname);
        
        // Only allow 'images' field for post uploads
        if (file.fieldname !== 'images') {
            return cb(new Error(`Invalid field name: ${file.fieldname}. Only 'images' is allowed for posts.`));
        }
        
        imageFileFilter(req, file, cb);
    }
});

// ========== MESSAGE IMAGE UPLOAD ========== ADD THIS
const uploadMessageConfig = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only 1 image per message
    },
    fileFilter: (req, file, cb) => {
        console.log('Message upload - fieldname:', file.fieldname);
        
        // Only allow 'image' field for message uploads
        if (file.fieldname !== 'image') {
            return cb(new Error(`Invalid field name: ${file.fieldname}. Only 'image' is allowed for messages.`));
        }
        
        imageFileFilter(req, file, cb);
    }
});

// ========== STORY UPLOAD ========== 
const uploadStoryConfig = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for stories (videos can be larger)
        files: 1 // Only 1 media file per story
    },
    fileFilter: (req, file, cb) => {
        console.log('Story upload - fieldname:', file.fieldname);
        
        // Only allow 'media' field for story uploads
        if (file.fieldname !== 'media') {
            return cb(new Error(`Invalid field name: ${file.fieldname}. Only 'media' is allowed for stories.`));
        }
        
        // Allow both images and videos for stories
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed for stories!'), false);
        }
    }
});

// Export different upload configurations
export const upload = uploadUserConfig;
export const uploadAny = uploadUserConfig.any();

// Export post-specific upload middleware
export const uploadPostImages = uploadPostConfig;

// Export message-specific upload middleware ADD THIS
export const uploadMessageImage = uploadMessageConfig;

// Optional: Export individual middleware functions
export const uploadSingleProfile = uploadUserConfig.single('profile');
export const uploadSingleCover = uploadUserConfig.single('cover');
export const uploadMultiplePostImages = uploadPostConfig.array('images', 5);
export const uploadSingleMessageImage = uploadMessageConfig.single('image'); // ADD THIS

// Export story-specific upload middleware
export const uploadStoryMedia = uploadStoryConfig;
export const uploadSingleStoryMedia = uploadStoryConfig.single('media');