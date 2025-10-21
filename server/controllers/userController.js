import mongoose from "mongoose";
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import { createUserFromClerk, uploadToImageKit } from "../utils/userUtils.js";
import { inngest } from "../inngest/index.js"; 

// Get user data by userId
export const getUserData = async (req, res) => {
    try {
        const { userId } = req.auth();
        let user = await User.findById(userId);

        // If user doesn't exist, create from Clerk
        if (!user) {
            console.log('User not in DB, creating from Clerk...');
            try {
                user = await createUserFromClerk(userId);
                console.log('User created successfully:', user._id);
            } catch (clerkError) {
                console.error('Error creating user from Clerk:', clerkError);
                return res.json({
                    success: false,
                    message: "User not found and couldn't create from Clerk data"
                });
            }
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Get user data error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Update user data
export const updateUserData = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { username, bio, location, full_name } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Prepare update data
        const updatedData = {
            username: user.username,
            bio: bio || user.bio,
            location: location || user.location,
            full_name: full_name || user.full_name
        };

        // Handle username update
        if (username && user.username !== username) {
            const existingUser = await User.findOne({ username });
            if (!existingUser) {
                updatedData.username = username;
            }
        }

        // Handle file uploads
        const { profile, cover } = req.files || {};

        if (profile?.[0]) {
            try {
                updatedData.profile_picture = await uploadToImageKit(profile[0], userId, 'profile');
            } catch (error) {
                console.error('Profile upload error:', error);
                return res.json({
                    success: false,
                    message: `Profile image upload failed: ${error.message}`
                });
            }
        }

        if (cover?.[0]) {
            try {
                updatedData.cover_photo = await uploadToImageKit(cover[0], userId, 'cover');
            } catch (error) {
                console.error('Cover upload error:', error);
                return res.json({
                    success: false,
                    message: `Cover image upload failed: ${error.message}`
                });
            }
        }

        console.log('Updating user with:', updatedData);
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });

        res.json({ 
            success: true, 
            user: updatedUser, 
            message: 'Profile updated successfully' 
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Discover users by search input
export const discoverUsers = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { input } = req.body;

        if (!input?.trim()) {
            return res.json({ success: false, message: "Search input is required" });
        }

        const searchRegex = new RegExp(input, 'i');
        const allUsers = await User.find({
            $or: [
                { username: searchRegex },
                { email: searchRegex },
                { full_name: searchRegex },
                { location: searchRegex }
            ]
        }).limit(50);

        const filteredUsers = allUsers.filter(user => user._id.toString() !== userId);

        res.json({ success: true, users: filteredUsers });

    } catch (error) {
        console.error('Discover users error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Follow user
export const followUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        if (!id) {
            return res.json({ success: false, message: "User id is required" });
        }

        if (userId === id) {
            return res.json({ success: false, message: "You cannot follow yourself" });
        }

        const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(id)
        ]);

        if (!user) return res.json({ success: false, message: "User not found" });
        if (!targetUser) return res.json({ success: false, message: "Target user not found" });

        if (user.following.includes(id)) {
            return res.json({ success: false, message: 'You are already following this user' });
        }

        user.following.push(id);
        targetUser.followers.push(userId);

        await Promise.all([user.save(), targetUser.save()]);

        res.json({ success: true, message: 'Now you are following this user' });

    } catch (error) {
        console.error('Follow user error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Unfollow user
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        if (!id) {
            return res.json({ success: false, message: "User id is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        user.following = user.following.filter(fId => fId.toString() !== id);
        
        const targetUser = await User.findById(id);
        if (targetUser) {
            targetUser.followers = targetUser.followers.filter(fId => fId.toString() !== userId);
            await Promise.all([user.save(), targetUser.save()]);
        } else {
            await user.save();
        }

        res.json({ success: true, message: 'You are no longer following this user' });

    } catch (error) {
        console.error('Unfollow user error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Send connection request
export const sendConnectionRequest = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        // Check for spam (max 20 requests in 24h)
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const connectionRequests = await Connection.find({
            from_user_id: userId,
            created_at: { $gt: last24Hours },
        });

        if (connectionRequests.length >= 20) {
            return res.json({
                success: false,
                message: "You have sent more than 20 connection requests in the last 24 hours",
            });
        }

        // Check if already connected
        let connection = await Connection.findOne({
            $or: [
                { from_user_id: userId, to_user_id: id },
                { from_user_id: id, to_user_id: userId },
            ],
        });

        if (!connection) {
            connection = await Connection.create({
                from_user_id: userId,
                to_user_id: id,
            });

            // Send event to Inngest
            await inngest.send({
                name: "app/connection-request",
                data: {
                    connectionId: connection._id.toString(),
                },
            });

            return res.json({
                success: true,
                message: "Connection request sent successfully",
            });
        } else if (connection.status === "accepted") {
            return res.json({
                success: false,
                message: "You are already connected with this user",
            });
        }

        return res.json({
            success: false,
            message: "Connection request pending",
        });
    } catch (error) {
        console.error("Connection request error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get user connections
export const getUserConnections = async (req, res) => {
    try {
        const { userId } = req.auth();
        
        console.log('Fetching connections for user:', userId);
        
        const user = await User.findById(userId)
            .populate('connections', 'full_name username profile_picture bio location followers')
            .populate('followers', 'full_name username profile_picture bio location followers')
            .populate('following', 'full_name username profile_picture bio location followers');

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const connections = user.connections || [];
        const followers = user.followers || [];
        const following = user.following || [];

        const pendingConnections = (
            await Connection.find({ to_user_id: userId, status: 'pending' })
                .populate('from_user_id', 'full_name username profile_picture bio location followers')
        ).map(connection => connection.from_user_id);

        console.log(`Found: ${connections.length} connections, ${followers.length} followers, ${following.length} following, ${pendingConnections.length} pending`);

        res.json({ 
            success: true, 
            connections, 
            followers, 
            following, 
            pendingConnections 
        });
    } catch (error) {
        console.error('Get connections error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Accept connection request
export const acceptConnectionRequest = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const connection = await Connection.findOne({ 
            from_user_id: id, 
            to_user_id: userId,
            status: 'pending'
        });

        if (!connection) {
            return res.json({ success: false, message: 'Connection request not found' });
        }

        const [user, toUser] = await Promise.all([
            User.findById(userId),
            User.findById(id)
        ]);

        if (!user || !toUser) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Add to connections
        if (!user.connections.includes(id)) {
            user.connections.push(id);
        }
        if (!toUser.connections.includes(userId)) {
            toUser.connections.push(userId);
        }

        // Update connection status
        connection.status = 'accepted';

        await Promise.all([user.save(), toUser.save(), connection.save()]);

        res.json({ success: true, message: 'Connection accepted successfully' });
    } catch (error) {
        console.error('Accept connection error:', error);
        res.json({ success: false, message: error.message });
    }
};