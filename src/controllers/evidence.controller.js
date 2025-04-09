import { Evidence } from "../models/evidence.models.js";
import { ApiResponse } from "../Utils/ApiSuccessResponse.js";
import { ApiError } from "../Utils/ApiErrorResponse.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";

const getEvidence = asyncHandler(async (req, res) => {
    const evidenceId = req.params.id;

    console.log(evidenceId);
    
    const evidence = await Evidence.findById(evidenceId).populate({
        path: 'userId',
        model: 'User',  
        select: 'fullname email', 
    }).populate({
        path: 'reportId',
        model: 'Reports',  
        select: 'caseNumber',
    })

    if (!evidence) {
        return ApiError(res, 404, "Evidence not found!");
    }

    return res
    .status(200)
    .json(new ApiResponse (200, evidence,"Evidence fetched successfully!",));
});

const getAllEvidence = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, caseId } = req.query;
    const query = {};

    // Add caseId to query if provided
    if (caseId) {
        query.reportId = caseId;
    }

    // Convert page and limit to numbers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Validate pagination parameters
    if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
        return ApiError(res, 400, "Invalid pagination parameters");
    }

    const [evidences, totalEvidences] = await Promise.all([
        Evidence.find(query)
            .populate({
                path: 'reportId',
                model: 'Reports',  
                select: 'caseNumber',
            })
            .populate({
                path: 'userId',
                model: 'User',  
                select: 'fullname email', 
            })
            .sort({ createdAt: -1 }) 
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .lean(),
        Evidence.countDocuments(query)
    ]);

    if (!evidences || evidences.length === 0) {
        return ApiError(res, 404, "No evidence found!");
    }

    const totalPages = Math.ceil(totalEvidences / limitNumber);

    return res
    .status(200)
    .json(new ApiResponse(200, {
            evidences,
            pagination: {
            totalItems: totalEvidences,
            currentPage: pageNumber,
            totalPages,
            itemsPerPage: limitNumber,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1,
        },
    }, "All evidence fetched successfully!"));
});

const deleteEvidence = asyncHandler(async (req, res) => {
    const evidenceId = req.params.id;

    const evidence = await Evidence.findByIdAndDelete(evidenceId);

    if (!evidence) {
        return ApiError(res, 404, "Evidence not found!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Evidence deleted successfully!", {}));
});

const deleteAllEvidence = asyncHandler(async (req, res) => {
    const result = await Evidence.deleteMany({});

    if (result.deletedCount === 0) {
        return ApiError(res, 404, "No evidence found to delete!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "All evidence deleted successfully!", { deletedCount: result.deletedCount }));
});

export {
    getEvidence,
    getAllEvidence,
    deleteEvidence,
    deleteAllEvidence
}