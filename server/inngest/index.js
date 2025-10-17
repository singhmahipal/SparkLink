import { Inngest } from "inngest";
import User from "../models/User.js";
import mongoose from "mongoose";
import Connection from "../models/Connection.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "sparklink-app" });

// Helper function to ensure DB connection
const ensureDbConnection = async () => {
    if (mongoose.connection.readyState === 0) {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(`${process.env.MONGODB_URL}/sparklink`);
        console.log('MongoDB connected');
    }
};

// Inngest function to save user data to database
const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-from-clerk'},
    {event: 'clerk/user.created'},
    async ({event, step}) => {
        return await step.run('create-user-in-db', async () => {
            try {
                // Ensure database connection
                await ensureDbConnection();
                
                console.log('Clerk webhook - User Created:', event.data);
                
                const {id, first_name, last_name, email_addresses, image_url} = event.data;
                
                // Check if user already exists
                const existingUser = await User.findById(id);
                if (existingUser) {
                    console.log('User already exists in database');
                    return { success: true, message: 'User already exists', userId: id };
                }
                
                // Validate required data
                if (!email_addresses || email_addresses.length === 0) {
                    console.error('No email addresses found');
                    throw new Error('Email address is required');
                }
                
                let username = email_addresses[0].email_address.split('@')[0];

                // Check availability of username
                const userWithSameUsername = await User.findOne({username});

                if (userWithSameUsername) {
                    username = username + Math.floor(Math.random() * 10000);
                }

                const userData = {
                    _id: id, 
                    email: email_addresses[0].email_address,
                    full_name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
                    profile_picture: image_url || '',
                    username,
                    bio: 'hey there! I am using sparklink.',
                    location: '',
                    followers: [],
                    following: [],
                    connections: []
                }
                
                const newUser = await User.create(userData);
                console.log('User created successfully:', newUser._id);
                
                return { success: true, userId: newUser._id };
            } catch (error) {
                console.error('Error in syncUserCreation:', error);
                throw error;
            }
        });
    }
)

// Inngest Function to update user data in database
const syncUserUpdation = inngest.createFunction(
    {id: 'update-user-with-clerk'},
    {event: 'clerk/user.updated'},
    async ({event, step}) => {
        return await step.run('update-user-in-db', async () => {
            try {
                // Ensure database connection
                await ensureDbConnection();
                
                console.log('Clerk webhook - User Updated:', event.data);
                
                const {id, first_name, last_name, email_addresses, image_url} = event.data;

                const updatedUserData = {
                    email: email_addresses[0].email_address,
                    full_name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
                    profile_picture: image_url || ''
                }
                
                const updatedUser = await User.findByIdAndUpdate(id, updatedUserData, {new: true});
                
                if (updatedUser) {
                    console.log('User updated successfully:', updatedUser._id);
                    return { success: true, userId: updatedUser._id };
                } else {
                    console.log('User not found for update');
                    return { success: false, message: 'User not found' };
                }
            } catch (error) {
                console.error('Error in syncUserUpdation:', error);
                throw error;
            }
        });
    }
)

// Inngest Function to delete user data in database
const syncUserDeletion = inngest.createFunction(
    {id: 'delete-user-from-clerk'},
    {event: 'clerk/user.deleted'},
    async ({event, step}) => {
        return await step.run('delete-user-from-db', async () => {
            try {
                // Ensure database connection
                await ensureDbConnection();
                
                console.log('Clerk webhook - User Deleted:', event.data);
                
                const {id} = event.data;
                const deletedUser = await User.findByIdAndDelete(id);
                
                if (deletedUser) {
                    console.log('User deleted successfully:', id);
                    return { success: true, userId: id };
                } else {
                    console.log('User not found for deletion');
                    return { success: false, message: 'User not found' };
                }
            } catch (error) {
                console.error('Error in syncUserDeletion:', error);
                throw error;
            }
        });
    }
)

// Inngest function to send reminder when a new connection request is added
const sendNewConnectionRequestReminder = inngest.createFunction(
    {id: "send-new-connection-request-reminder"},
    {event: "app/connection-request"},
    async ({event, step}) => {
        const {connectionId} = event.data;

        // First email - immediate notification
        await step.run('send-connection-request-mail', async () => {
            await ensureDbConnection();
            
            const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');
            
            if (!connection) {
                console.log('Connection not found');
                return { message: 'Connection not found' };
            }
            
            const subject = 'New Connection Request';
            const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Hi ${connection.to_user_id.full_name},</h2>
                <p>You have a new connection request from ${connection.from_user_id.full_name} @${connection.from_user_id.username}</p>
                <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
                <br/>
                <p>Thanks, <br/>SparkLink - Stay Connected</p>
            </div>`;
            
            await sendEmail({to: connection.to_user_id.email, subject, body});
            console.log('Initial connection request email sent');
            
            return { message: 'Initial email sent' };
        });

        // Wait 24 hours
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await step.sleepUntil("wait-24-hours", in24Hours);
        
        // Second email - reminder after 24 hours
        await step.run('send-connection-request-reminder', async () => {
            await ensureDbConnection();
            
            const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');
            
            if (!connection) {
                console.log('Connection not found for reminder');
                return { message: 'Connection not found' };
            }

            if (connection.status === 'accepted') {
                console.log('Connection already accepted, skipping reminder');
                return { message: 'Already accepted' };
            }

            const subject = 'Reminder: New Connection Request';
            const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Hi ${connection.to_user_id.full_name},</h2>
                <p>This is a reminder that you have a pending connection request from ${connection.from_user_id.full_name} @${connection.from_user_id.username}</p>
                <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
                <br/>
                <p>Thanks, <br/>SparkLink - Stay Connected</p>
            </div>`;
            
            await sendEmail({to: connection.to_user_id.email, subject, body});
            console.log('Connection request reminder email sent');
            
            return { message: 'Reminder sent' };
        });

        return { message: 'Connection request flow completed' };
    }
)

// Export functions for Inngest
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendNewConnectionRequestReminder
];