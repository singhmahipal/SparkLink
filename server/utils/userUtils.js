import User from '../models/User.js';
import imagekit from '../configs/imageKit.js';
import fs from 'fs';

// Fetch user from Clerk API
export const fetchClerkUser = async (userId) => {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user from Clerk');
    }

    return await response.json();
};

// Generate unique username
export const generateUniqueUsername = async (baseUsername, userId) => {
    let username = baseUsername || `user_${userId.slice(0, 8)}`;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        username = `${username}${Math.floor(Math.random() * 10000)}`;
    }
    
    return username;
};

// Create user from Clerk data
export const createUserFromClerk = async (userId) => {
    const clerkUser = await fetchClerkUser(userId);
    
    const email = clerkUser.email_addresses?.[0]?.email_address || '';
    const firstName = clerkUser.first_name || '';
    const lastName = clerkUser.last_name || '';
    const imageUrl = clerkUser.image_url || '';
    
    const baseUsername = email.split('@')[0];
    const username = await generateUniqueUsername(baseUsername, userId);
    
    return await User.create({
        _id: userId,
        email,
        full_name: `${firstName} ${lastName}`.trim() || 'User',
        username,
        profile_picture: imageUrl,
        bio: 'hey there! I am using sparklink.',
        location: '',
        followers: [],
        following: [],
        connections: []
    });
};

// Upload file to ImageKit
export const uploadToImageKit = async (file, userId, type) => {
    try {
        if (!file?.path || !fs.existsSync(file.path)) {
            throw new Error(`${type} file not found at path: ${file.path}`);
        }

        console.log(`Uploading ${type} to ImageKit...`);
        
        const buffer = fs.readFileSync(file.path);
        
        const response = await imagekit.upload({
            file: buffer,
            fileName: `${type}_${userId}_${Date.now()}_${file.originalname}`,
            folder: `/sparklink/${type}s/`
        });
        
        if (!response?.filePath) {
            throw new Error(`Invalid ImageKit response for ${type}`);
        }
        
        const url = imagekit.url({
            path: response.filePath,
            transformation: [
                { quality: 'auto' },
                { format: 'webp' },
                { width: type === 'profile' ? '512' : '1280' }
            ]
        });
        
        return url;
    } finally {
        // Always clean up temp file
        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    }
};

// Organize uploaded files by field name
export const organizeUploadedFiles = (files) => {
    if (!Array.isArray(files)) return {};
    
    const fieldMapping = {
        profile: ['profile', 'profilePicture', 'profile_picture', 'avatar'],
        cover: ['cover', 'coverPhoto', 'cover_photo', 'banner']
    };
    
    const organized = {};
    
    files.forEach(file => {
        for (const [target, sources] of Object.entries(fieldMapping)) {
            if (sources.includes(file.fieldname)) {
                if (!organized[target]) organized[target] = [];
                organized[target].push(file);
                break;
            }
        }
    });
    
    return organized;
};