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

// Export different upload configurations
export const upload = uploadUserConfig;
export const uploadAny = uploadUserConfig.any();

// Export post-specific upload middleware
export const uploadPostImages = uploadPostConfig;

// Optional: Export individual middleware functions
export const uploadSingleProfile = uploadUserConfig.single('profile');
export const uploadSingleCover = uploadUserConfig.single('cover');
export const uploadMultiplePostImages = uploadPostConfig.array('images', 5);