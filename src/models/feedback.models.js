import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required!"],
        index: true,
        minlength: [3, 'Name must be at least 3 characters long!'],
    },
    email: {
        type: String,
        required: [true, "Email is required!"],
        index: true,
        match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Email is invalid!'],
    },
    date: {
        type: Date,
        required: true,
    },
    type: {
        type: String,
        required: [true, "Feedback type is required!"],
        index: true,
        enum: ['complaint', 'suggestion', 'query', 'general', 'user support', 'report issue', 'other'],
    },
    message: {
        type: String,
        required: [true, "Message is required!"],
        minlength: [10, 'Message must be at least 10 characters long!'],
    },
}, { timestamps: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);