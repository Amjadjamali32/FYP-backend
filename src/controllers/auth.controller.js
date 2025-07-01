import { User } from '../models/user.models.js';
import { asyncHandler } from "../Utils/AsyncHandler.js"
import { ApiError} from "../Utils/ApiErrorResponse.js"
import { ApiResponse } from "../Utils/ApiSuccessResponse.js"
import { uploadOnCloudinary } from "../services/cloudinary.js"
import { sendAccountVerificationEmail, sendLoginSuccessEmail, sendPasswordResetEmail } from "../services/emailServices.js"
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { failedLoginCache } from '../middlewares/loginFailed.js';

// generate access and refresh tokens
const generateTokens = async (user) => {
    try {   
            const accessToken = jwt.sign({
                _id: user._id,
                email: user.email,
                fullName: user.fullname,
            },
                process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRY
            });

            const refreshToken = jwt.sign({
                _id: user._id,
            },
                process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            });

            user.refreshToken = refreshToken;
            await user.save({ validateBeforeSave: false });

            // console.log(accessToken, refreshToken);

            return { accessToken, refreshToken };
    } catch (error) {
        return ApiError(res, 501, "Something went wrong while generating access and refresh token!")
    }
}

// registration
const registration = asyncHandler(async (req, res) => {
    const { fullname, email, mobile, gender, password, NICNumber, address } = req.body;

    try {
        if ([fullname, email, mobile, password, gender, NICNumber, address].some((field) => field?.trim() === "")) {
            return ApiError(res, 400, 'All fields are required!')
        }

        // Fullname validation (e.g., checking if the name contains only alphabets and spaces)
        if (!/^[a-zA-Z\s]+$/.test(fullname)) {
            return ApiError(res, 400, 'Full name must only contain alphabets and spaces!');
        }

        // Email validation (checking if it's in the correct format)
        const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
        if (!emailRegex.test(email)) {
            return ApiError(res, 400, 'Invalid email format!');
        }

        // Mobile number validation (checking if it's a valid Pakistani mobile number)
        const mobileRegex = /^(\+92|92)[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            return ApiError(res, 400, 'Please enter a valid Pakistani mobile number!');
        }

        // NIC number validation (matching against the required format)
        const nicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!nicRegex.test(NICNumber)) {
            return ApiError(res, 400, 'Invalid NIC number! Please enter a valid NIC number.');
        }

        // Address validation (ensure it's not empty and doesn't exceed max length)
        if (address.length > 255) {
            return ApiError(res, 400, 'Address must be less than 255 characters!');
        }

        // Check for existing email or NIC
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { NICNumber }],
        });

        if (existingUser) {
            const errorMessage = existingUser.email === email.toLowerCase() 
                ? 'Email already exists!'
                : 'NIC number already exists!';
            return ApiError(res, 400, errorMessage);
        }

        const NICImageLocalPath = req.files?.NICImage?.[0]?.path;
        const profileImageLocalPath = req.files?.profileImage?.[0]?.path;

        // console.log(NICImageLocalPath, profileImageLocalPath);

        if (!NICImageLocalPath) {
            return ApiError(res, 400, 'NIC image is required!')
        }

        // Generate a secure token for email verification
        const emailVerificationToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(emailVerificationToken).digest("hex");

        // Set expiry time for the token
        const emailVerificationExpiry = Date.now() + 3600000; // 1 hour

        // Uploading NIC image to Cloudinary
        const NICImage = await uploadOnCloudinary(NICImageLocalPath);

        if (!NICImage) {
            return ApiError(res, 401, 'NIC image uploading failed!');
        }

        // Uploading profile image to Cloudinary
        const profileImage = await uploadOnCloudinary(profileImageLocalPath);

        const user = await User.create({
            fullname: fullname.toLowerCase(),
            email,
            mobile,
            gender,
            password,
            NICNumber,
            address,
            NICImage: NICImage.url,
            profileImage: profileImage?.url || "",
            role: "user",
            isEmailVerified: false,
            emailVerificationToken: hashedToken,
            emailVerificationExpiry,
            fcmToken: "",
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            return ApiError(res, 500, 'Something went wrong in user creation!')
        }

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;

        await sendAccountVerificationEmail(fullname, email, verificationUrl);

        return res.status(201).json(
            new ApiResponse(201, "Signup successful. Please check your email to verify your account")
        );
    }
    catch (error) {
        console.error("Error registering user: ", error);
        return ApiError(res, 500, 'An error occurred during registration!')
    }
})

// email verification
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOneAndUpdate(
            {
                emailVerificationToken: hashedToken,
                emailVerificationExpiry: { $gt: Date.now() },  
            },
            {
                $set: {
                    isEmailVerified: true, 
                    emailVerificationToken: null, 
                    emailVerificationExpiry: null, 
                }
            },
            { 
                new: true, 
            }
        );

        if (!user) {
            return ApiError(res, 401, 'Invalid or expired token!');
        }

        return res.
        status(200)
        .json(
            new ApiResponse(200, {}, "Email verified successfully!")
        );
    } catch (error) {
        console.error("Error verifying email: ", error);
        return ApiError(res, 500, 'An error occured during email verification!')
    }
});

// login 
const login = asyncHandler(async (req, res) => {
    const { email , password, fcmToken } = req.body
    const ip = req.ip; // Get the client's IP address

    if(!email || !password) {
        return ApiError(res, 400, 'Email and password are required!')
    }

    const user = await User.findOne({ email });

    if(!user) {
        // Increment failed login attempts for this IP
        const failedAttempts = failedLoginCache.get(ip) || 0;
        failedLoginCache.set(ip, failedAttempts + 1);
        return ApiError(res, 404, 'User does not found!')
    }

    const isPasswordValid = await user.matchPassword(password)
    
    if(!isPasswordValid) {
        // Increment failed login attempts for this IP
        const failedAttempts = failedLoginCache.get(ip) || 0;
        failedLoginCache.set(ip, failedAttempts + 1);
       return ApiError(res, 401, 'Email or password is Incorrect!')
    }

    // If login is successful, reset the failed attempts counter for this IP
    failedLoginCache.del(ip);

    // Update user's FCM token if provided
    if (fcmToken) {
        user.fcmToken = fcmToken;
        await user.save();
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    await sendLoginSuccessEmail(loggedInUser.fullname, loggedInUser.email)

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // Secure cookies in production (only sent over HTTPS)
        sameSite: 'none', // Can be 'Strict', 'Lax', or 'None'
    };

    return res
    .status(200)
    .cookie("accessToken" , accessToken, { ...cookieOptions, maxAge: 1 * 24 * 60 * 60 * 1000 })
    .cookie("refreshToken" , refreshToken , { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 })
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User loggedIn Successfully"
        )
    )    
});

// update FCM token
const updateFCMToken = asyncHandler(async (req, res) => {
    const { userId, fcmToken } = req.body;
  
    if (!userId || !fcmToken) {
      return ApiError(res, 400, 'User ID and FCM token are required!');
    }
  
    const user = await User.findById(userId);
  
    if (!user) {
      return ApiError(res, 404, 'User not found!');
    }
  
    // Update the FCM token
    user.fcmToken = fcmToken;
    await user.save();
  
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, 'FCM token updated successfully')
    );
});

// forgotPassword
const forgotPassword = asyncHandler(async (req , res) => { 
    const { email } = req.body;
     
    if(!email) {
        return ApiError(res, 401, 'Email is required!')
    }

    const user = await User.findOne({ email });
    
    if (!user) {
        return ApiError(res, 404, 'User not found!')
    }

    // Generate a JWT reset token
    const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" } // Expires in 1 hour
    );

    user.resetPasswordToken = resetToken, 
    user.resetPasswordExpires = Date.now() + 3600000 
    await user.save()
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(user.fullname, user.email, resetUrl);

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Password reset link has been sent to your email.")
    );
})

// Refresh Token Controller (remaining)
const refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        return ApiError(res, 401, 'Refresh Token is required!');
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log(decoded);

        // Find the user in the database
        const user = await User.findById(decoded._id);

        if (!user) {
            return ApiError(res, 404, 'User not found!');
        }

        // Optionally, invalidate old refresh token stored in the user document
        if (user.refreshToken !== refreshToken) {
            return ApiError(res, 401, 'Invalid refresh token!');
        }

        // Generate new access and refresh tokens
        const { accessToken, newRefreshToken } = await generateTokens(user);
    
        // Update the user's refresh token in the database
        user.refreshToken = newRefreshToken;
        await user.save();

        // Set the new access token and refresh token cookies
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            maxAge: 15 * 60 * 1000, // 15 minutes
            sameSite: 'none', // Can be 'Strict', 'Lax', or 'None'
        });
        
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'none', // Can be 'Strict', 'Lax', or 'None'
        });

        res
        .status(200)
        .json(new ApiResponse(201, {}, "Tokens updated successfully!" ));
    } catch (error) {
        console.error("Error during refresh token validation:", error);
        return ApiError(res, 403, 'Invalid or expired token!');
    }
});

// password not correct for logging in jwt error
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    // console.log(password, token); for debugging
    
    if (!token || !password) {
        return ApiError(res, 400, 'Password is required!')
    }

    try {
        // Verify the reset token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user
        const user = await User.findById(decoded.userId);

        if (!user || user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
            return ApiError(res, 401, 'Invalid or expired Token for reseting password!')
        }

        // Clear reset token, access token, and refresh token
        user.password = password
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });

        // Clear old cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password updated successfully. Now You can login with new password!")
        );
    } catch (err) {
        console.log(err)
        return ApiError(res, 400, 'Token is invalid or expired!')
    }
});

// getcurent user
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken");

    if (!user) {
        return ApiError(res, 404, "User not found!");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User fetched successfully")
    );
});

// logout
const logout = asyncHandler(async (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Successfully Logout user")
    );
});

export {
    registration,
    verifyEmail,
    login,
    updateFCMToken,
    forgotPassword,
    resetPassword,
    logout,
    refreshToken,
    getCurrentUser,
}
