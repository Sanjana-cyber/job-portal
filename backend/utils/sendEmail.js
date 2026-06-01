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
  // Create transporter with SMTP settings from environment
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Email message configuration
  const mailOptions = {
    from: `"Job Portal" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
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
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate,
};
