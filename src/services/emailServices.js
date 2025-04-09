import sendEmail from '../Utils/nodemailer.js';

// Helper function to send a generic email
const sendGenericEmail = async (to, subject, htmlContent) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: htmlContent,
    };
    
    try {
        await sendEmail(mailOptions);
    } catch (error) {
        console.error("Error in sending generic email:", error);
        throw new Error("Failed to send generic email");
    }
};

// Function to send account verification email
const sendAccountVerificationEmail = async (fullname, email, verificationUrl) => {
    const subject = "🎉 Welcome to Crime-GPT - Activate Your Account!";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://res.cloudinary.com/dxfzrwdwj/image/upload/v1734887166/xeuzt9pwfk7ejczpzhos.png" alt="Crime-GPT Logo" style="max-width: 100px; margin-bottom: 10px;">
            </div>
            <h2 style="color: #333;">Welcome to Crime-GPT, ${fullname}!</h2>
            <p style="color: #555; line-height: 1.5;">
                We're thrilled to have you on board! Your account has been successfully created, and you're just a step away from exploring all the amazing features we offer.
            </p>
            <p style="color: #555; line-height: 1.5;">
                Please click the button below to activate your account:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${verificationUrl}" style="background-color:rgb(16, 50, 86); color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; font-size: 16px;">
                    Activate My Account
                </a>
            </div>
            <p style="color: #555; line-height: 1.5;">
                If you did not create this account, please ignore this email or contact our support team.
            </p>
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
            <footer style="text-align: center; color: #999; font-size: 14px;">
                <p>Crime-GPT A Crime reporting system | Nawabshah, Sindh, Pakistan</p>
            </footer>
        </div>
    `;
    
    await sendGenericEmail(email, subject, htmlContent);
};

// Function to send login success notification email
const sendLoginSuccessEmail = async (fullname, email) => {
    const subject = "🎉 Successful Login to Crime-GPT!";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://res.cloudinary.com/dxfzrwdwj/image/upload/v1734887166/xeuzt9pwfk7ejczpzhos.png" alt="Crime-GPT Logo" style="max-width: 100px; margin-bottom: 10px;">
            </div>
            <h2 style="color: #333;">Hello ${fullname}, you've successfully logged in!</h2>
            <p style="color: #555; line-height: 1.5;">
                We just wanted to confirm that you have successfully logged into your Crime-GPT account. You're all set to explore our features and enhance your crime reporting experience.
            </p>
            <p style="color: #555; line-height: 1.5;">
                If this wasn't you, or if you suspect any unusual activity, please reset your password immediately and contact our support team.
            </p>
            <p style="color: #555; line-height: 1.5;">
                Thank you for using Crime-GPT, and stay safe!
            </p>
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
            <footer style="text-align: center; color: #999; font-size: 14px;">
                <p>Crime-GPT A Crime reporting system | Nawabshah, Sindh, Pakistan</p>
            </footer>
        </div>
    `;
    
    await sendGenericEmail(email, subject, htmlContent);
};

// Function to send password reset email
const sendPasswordResetEmail = async (fullname, email, resetUrl) => {
    const subject = "🔑 Reset Your Crime-GPT Password";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://res.cloudinary.com/dxfzrwdwj/image/upload/v1734887166/xeuzt9pwfk7ejczpzhos.png" alt="Crime-GPT Logo" style="max-width: 100px; margin-bottom: 10px;">
            </div>
            <h2 style="color: #333;">Hello ${fullname},</h2>
            <p style="color: #555; line-height: 1.5;">
                We received a request to reset your Crime-GPT account password. If you made this request, please click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${resetUrl}" style="background-color:rgb(16, 50, 86); color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; font-size: 16px;">
                    Reset Password
                </a>
            </div>
            <p style="color: #555; line-height: 1.5;">
                If you didn’t request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
            <footer style="text-align: center; color: #999; font-size: 14px;">
                <p>Crime-GPT A Crime reporting system | Nawabshah, Sindh, Pakistan</p>
            </footer>
        </div>
    `;
    
    await sendGenericEmail(email, subject, htmlContent);
};

// Function to send password change confirmation email
const sendPasswordChangeConfirmationEmail = async (fullname, email) => {
    const subject = "🔑 Your Crime-GPT Password Has Been Changed";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://res.cloudinary.com/dxfzrwdwj/image/upload/v1734887166/xeuzt9pwfk7ejczpzhos.png" alt="Crime-GPT Logo" style="max-width: 100px; margin-bottom: 10px;">
            </div>
            <h2 style="color: #333;">Hello ${fullname},</h2>
            <p style="color: #555; line-height: 1.5;">
                We wanted to inform you that your Crime-GPT account password has been successfully changed. 
            </p>
            <p style="color: #555; line-height: 1.5;">
                If you did not make this change, please contact our support team immediately.
            </p>
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
            <footer style="text-align: center; color: #999; font-size: 14px;">
                <p>Crime-GPT A Crime reporting system | Nawabshah, Sindh, Pakistan</p>
            </footer>
        </div>
    `;

    await sendGenericEmail(email, subject, htmlContent);
}

// Function to send crime report confirmation email with the report number
const sendCrimeReportConfirmationEmail = async (fullname, email, reportNumber) => {
    const subject = "📝 Your Crime Report Has Been Received";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://res.cloudinary.com/dxfzrwdwj/image/upload/v1734887166/xeuzt9pwfk7ejczpzhos.png" alt="Crime-GPT Logo" style="max-width: 100px; margin-bottom: 10px;">
            </div>
            <h2 style="color: #333;">Hello ${fullname},</h2>
            <p style="color: #555; line-height: 1.5;">
                We wanted to confirm that your crime report has been successfully received. Your report number is <strong>#${reportNumber}</strong>.
            </p>
            <p style="color: #555; line-height: 1.5;">
                Our team will review your report and take appropriate action. If you need to update or add any details, feel free to reach out to us.
            </p>
            <p style="color: #555; line-height: 1.5;">
                Thank you for helping us make our community safer!
            </p>
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
            <footer style="text-align: center; color: #999; font-size: 14px;">
                <p>Crime-GPT A Crime reporting system | Nawabshah, Sindh, Pakistan</p>
            </footer>
        </div>
    `;

    await sendGenericEmail(email, subject, htmlContent);
};

// Function to send crime report updated status email
const sendUpdatedCrimeReportEmail = async (fullname, email, reportNumber, reportStatus) => {
    const subject = "📢 Your Crime Report Has Been Updated";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://res.cloudinary.com/dxfzrwdwj/image/upload/v1734887166/xeuzt9pwfk7ejczpzhos.png" alt="Crime-GPT Logo" style="max-width: 100px; margin-bottom: 10px;">
            </div>
            <h2 style="color: #333;">Hello ${fullname},</h2>
            <p style="color: #555; line-height: 1.5;">
                We wanted to inform you that the status of your crime report has been successfully updated. Your report number is <strong>#${reportNumber}</strong>.
            </p>
            <p style="color: #555; line-height: 1.5;">
                The new status of your report is: <strong>${reportStatus}</strong>.
            </p>
            <p style="color: #555; line-height: 1.5;">
                Our team has reviewed the details, and we are working on taking the appropriate action. If you have any additional information or updates, feel free to contact us.
            </p>
            <p style="color: #555; line-height: 1.5;">
                Thank you for your continued support in making our community safer!
            </p>
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
            <footer style="text-align: center; color: #999; font-size: 14px;">
                <p>Crime-GPT A Crime Reporting System | Nawabshah, Sindh, Pakistan</p>
            </footer>
        </div>
    `;

    // Call your email sending function here (e.g., sendGenericEmail)
    await sendGenericEmail(email, subject, htmlContent);
};

export { sendAccountVerificationEmail, sendLoginSuccessEmail, sendPasswordResetEmail, sendPasswordChangeConfirmationEmail, sendCrimeReportConfirmationEmail, sendUpdatedCrimeReportEmail };