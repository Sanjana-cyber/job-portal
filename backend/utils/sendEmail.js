const nodemailer = require("nodemailer");

/**
 * Send email using Nodemailer
 * Supports verification emails and password reset emails
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML email body
 */
const sendEmail = async (options) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP credentials not configured. Skipping email dispatch.");
    return { skipped: true, reason: "SMTP credentials not configured" };
  }

  // Create transporter with SMTP settings from environment
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  // Email message configuration
  const mailOptions = {
    from: `"Talent Bridge Recruitment" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Generate HTML template for interview invitation email
 * @param {Object} data
 * @param {string} data.candidateName - Candidate's name
 * @param {string} data.jobTitle - Job title
 * @param {string} data.companyName - Company name
 * @param {string} data.invitationUrl - Secure invitation link
 * @returns {string} HTML email body
 */
const getInterviewInvitationEmailTemplate = ({
  candidateName,
  jobTitle,
  companyName,
  invitationUrl,
}) => {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;">
      <div style="background-color: #0a2558; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">Talent Bridge</h1>
      </div>
      <div style="background: #ffffff; padding: 35px 30px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">Dear ${candidateName || "Candidate"},</p>
        <p style="font-size: 16px;">
          Congratulations! You have been selected to proceed to the next stage of the recruitment process for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.
        </p>
        <p style="font-size: 16px;">
          Please use the secure link below to access your interview invitation:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${invitationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
            Join Interview
          </a>
        </div>
        <p style="font-size: 15px; color: #475569;">
          Or copy and paste this secure link into your browser:<br />
          <a href="${invitationUrl}" style="color: #2563eb; word-break: break-all; font-size: 14px;">${invitationUrl}</a>
        </p>
        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">This invitation link is personal to you and will expire in 7 days.</p>
        <p style="font-size: 16px; margin-bottom: 0;">We look forward to meeting you.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Regards,<br />
          <strong>Recruitment Team</strong><br />
          Talent Bridge
        </p>
      </div>
    </div>
  `;
};

/**
 * Generate HTML template for email verification
 * @param {string} name - User's name
 * @param {string} verificationUrl - Verification link
 * @returns {string} HTML email body
 */
const getVerificationEmailTemplate = (name, verificationUrl) => {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Job Portal</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
        <p style="color: #555; font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #555; font-size: 16px;">Thank you for registering! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
            Verify Email
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">This link will expire in 24 hours.</p>
        <p style="color: #888; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Generate HTML template for password reset email
 * @param {string} name - User's name
 * @param {string} resetUrl - Password reset link
 * @returns {string} HTML email body
 */
const getResetPasswordEmailTemplate = (name, resetUrl) => {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Job Portal</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #555; font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #555; font-size: 16px;">You requested a password reset. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">This link will expire in 10 minutes.</p>
        <p style="color: #888; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
      </div>
    </div>
  `;
};

module.exports = {
  sendEmail,
  getInterviewInvitationEmailTemplate,
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate,
};
