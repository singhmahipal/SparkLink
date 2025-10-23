import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    email: {type: String, required: true},
    full_name: {type: String, required: true},
    username: {type: String}, 
    bio: {type: String, default: 'hey there! I am using sparklink.'},
    profile_picture: {type: String, default: ''},
    cover_photo: {type: String, default: ''},
    location: {type: String, default: ''},
    followers: [{type: String, ref: 'User'}],
    following: [{type: String, ref: 'User'}],
    connections: [{type: String, ref: 'User'}],
}, {timestamps: true, minimize: false});

// Add indexes ONLY using schema.index() to avoid duplicates
userSchema.index({ email: 1 });
userSchema.index({ username: 1 }, { unique: true, sparse: true }); 
userSchema.index({ connections: 1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

const User = mongoose.model('User', userSchema);

export default User;