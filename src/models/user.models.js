import mongoose from "mongoose";
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, "Name is required!"],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters long!'],
        maxlength: [50, 'Name must be less than 50 characters long!'], 
        match: [/^[a-zA-Z\s]+$/, 'Name must only contain alphabets and spaces!'],
    },
    email:{
        type: String,
        required: [true, "Email is required!"],
        trim: true,
        unique: true,
        lowercase: true,
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Email is invalid!'],
        index: true,
    },
    gender: {
        type: String,
        required: [true, "Gender is required!"],
        enum: ['male', 'female', 'other'], 
        message: 'Gender must be male, female, or other!'
    },
    mobile: {
        type: String,
        required: [true, "Mobile number is required!"],
        minlength: [13, 'Mobile number must be 13 characters long!'],
        maxlength: [13, 'Mobile number must be 13 characters long!'], 
        match: [/^(\+92|92)[0-9]{10}$/, 'Please enter a valid Pakistani mobile number.'],  
    },
    password: {
        type: String,
        required: [true, "Password is required!"],
        minlength: [8, 'Password must be at least 8 characters long!'],
    },
    NICNumber: {
        type: String,
        required: [true, "NIC Number is required!"],
        match: [/^\d{5}-\d{7}-\d{1}$/, 'Please enter a valid NIC number in the format XXXXX-XXXXXXX-X!'],
        unique: true, 
        index: true,
    },
    NICImage: {
        type: String,
        required: [true, "NIC Picture is required!"],
    },
    profileImage: {
        type: String,
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    address: {
        type: String,
        required: [true, "Address is required!"],
        trim: true, 
        maxlength: [255, 'Address must be less than 255 characters long!'], 
    },
    isEmailVerified: {
        type: Boolean,
        default: false, 
    },
    emailVerificationToken: {
        type: String,
        default: null,
    },
    emailVerificationExpiry: {
        type: Date,
        default: null,
    },
    refreshToken: {
        type: String,
    },
    fcmToken: {
        type: String, // Store the latest FCM token
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
}, { timestamps: true});

// pre hook to encrypt password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model('User', userSchema);