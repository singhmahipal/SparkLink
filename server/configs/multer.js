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

// Configure multer with file filter and size limits
const uploadConfig = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 2 // Maximum 2 files
    },
    fileFilter: (req, file, cb) => {
        console.log('File filter check:');
        console.log('- fieldname:', file.fieldname);
        console.log('- originalname:', file.originalname);
        console.log('- mimetype:', file.mimetype);
        
        // Only allow specific field names
        if (!['profile', 'cover'].includes(file.fieldname)) {
            return cb(new Error(`Invalid field name: ${file.fieldname}. Only 'profile' and 'cover' are allowed.`));
        }
        
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Export upload configurations
export const upload = uploadConfig;
export const uploadAny = uploadConfig.any();