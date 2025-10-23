import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Message from '../models/Message.js';

// Create an empty object to store SSE connections
const connections = {};

// Controller function for the SSE endpoint
export const sseController = (req, res) => {
    const {userId} = req.params;
    console.log('New client connected:', userId); 

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache'); 
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Add the client's response object to the connections object
    connections[userId] = res;

    // Send an initial event to the client
    res.write('data: connected to SSE stream\n\n'); 

    // Handle client disconnection
    req.on('close', () => {
        delete connections[userId];
        console.log('Client disconnected:', userId);
    });
};

// Send message
export const sendMessage = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {to_user_id, text} = req.body;
        const image = req.file;

        let media_url = '';
        let message_type = image ? 'image' : 'text'; 

        if (message_type === 'image') { 
            if (!image) {
                return res.json({success: false, message: 'Image file is required'});
            }

            const fileBuffer = fs.readFileSync(image.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname,
                folder: 'messages'
            });
            
            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    {quality: 'auto'},
                    {format: 'webp'},
                    {width: '1280'}
                ]
            });

            // Clean up temp file
            fs.unlinkSync(image.path);
        }

        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        });

        // Populate user data before sending response
        const messageWithUserData = await Message.findById(message._id)
            .populate('from_user_id', 'full_name profile_picture username');

        res.json({success: true, message: messageWithUserData});

        // Send message to to_user_id using SSE
        if (connections[to_user_id]) {
            connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`);
        }

    } catch (error) {
        console.error('Send message error:', error);
        res.json({success: false, message: error.message});
    }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {to_user_id} = req.body;

        const messages = await Message.find({
            $or: [
                {from_user_id: userId, to_user_id},
                {from_user_id: to_user_id, to_user_id: userId}
            ]
        }).sort({createdAt: -1}); 
        
        // Mark messages as seen
        await Message.updateMany(
            {from_user_id: to_user_id, to_user_id: userId, seen: false}, 
            {seen: true}
        );

        res.json({success: true, messages});
    } catch (error) {
        console.error('Get messages error:', error);
        res.json({success: false, message: error.message});
    }
};

export const getUserRecentMessages = async (req, res) => {
    try {
        const {userId} = req.auth();
        const messages = await Message.find({to_user_id: userId})
            .populate('from_user_id to_user_id')
            .sort({createdAt: -1}); 

        res.json({success: true, messages});
    } catch (error) {
        console.error('Get recent messages error:', error);
        res.json({success: false, message: error.message});
    }
};