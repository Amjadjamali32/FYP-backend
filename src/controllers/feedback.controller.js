import { Feedback } from '../models/feedback.models.js';
import { ApiError } from '../Utils/ApiErrorResponse.js';
import { ApiResponse } from '../Utils/ApiSuccessResponse.js';
import { asyncHandler } from '../Utils/AsyncHandler.js';

// feedback user controllers
// create feedback
const createFeedback = asyncHandler(async (req, res) => {
    const { name, email, date, type, message} = req.body;


    if(!name || !email || !date || !type || !message){
        return ApiError(res, 400, "Please provide all required fields!");
    }

    // create feedback
    const feedback = await Feedback.create({
        name,
        email,
        date,
        type,
        message,
    });

    if(!feedback){
        return ApiError(res, 500, "Error while creating feedback!");
    }

    return res
    .status(201)
    .json(new ApiResponse(201, {}, "Feedback created successfully!"));
});

// admin controllers
// get single feedback
const getSingleFeedback = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);

    if(!feedback){
        return ApiError(res, 404, "Feedback not found!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, feedback, "Feedback retrieved successfully!"));
});

// get all feedback
const getAllFeedbacks = asyncHandler(async (req, res) => {
    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 });

    if(!feedbacks){
        return ApiError(res, 404, "Feedback not found!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, feedbacks, "Feedbacks retrieved successfully!"));
});

// delete feedback
const deleteFeedback = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);

    if(!feedback){
        return ApiError(res, 404, "Feedback not found!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, feedback, "Feedback deleted successfully!"));
});

// delete all feedback
const deleteAllFeedbacks = asyncHandler(async (req, res) => {
    const result = await Feedback.deleteMany({});

    // Check if any feedbacks were deleted
    if (result.deletedCount === 0) {
        return res
            .status(404)
            .json(new ApiResponse(404, null, "No feedbacks found to delete!"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "All feedbacks deleted successfully!"));
});
export { createFeedback, getSingleFeedback, getAllFeedbacks, deleteFeedback, deleteAllFeedbacks };
