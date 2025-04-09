const ApiError = (res, statusCode = 500, message = 'Something went wrong!', data = null) => {
    return res.status(statusCode).json({
        success: false,
        message: message,
        data: data,  // This can hold additional error data (like validation errors)
    });
};

export { ApiError };
