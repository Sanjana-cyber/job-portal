const nodemailer = require("nodemailer");
const dns = require("node:dns");

// Force IPv4 first to prevent ENETUNREACH on networks without IPv6 internet routes
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

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
  const smtpUser = (process.env.SMTP_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

  if (!smtpUser || !smtpPass) {
    console.warn("⚠️ SMTP credentials not configured. Skipping email dispatch.");
    return { skipped: true, reason: "SMTP credentials not configured in backend/.env" };
  }

  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const isSecure = port === 465;

  const transportConfig = {
    host,
    port,
    secure: isSecure, // false for port 587 (STARTTLS), true for port 465 (SSL)
    family: 4, // Force IPv4 to prevent ENETUNREACH on systems without IPv6 routing
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };

  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
    from: `"Talent Bridge Recruitment" <${smtpUser}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [sendEmail] Email successfully dispatched to ${options.to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const isAuth =
      err.code === "EAUTH" ||
      (err.message && (err.message.includes("535") || err.message.includes("BadCredentials")));

    if (isAuth) {
      console.error(
        `\n⚠️ [sendEmail] Gmail Authentication Failed (535-5.7.8 BadCredentials) for ${smtpUser}.\n` +
        `   Google requires an active 16-character App Password when 2-Step Verification is enabled.\n` +
        `   Please generate one at https://myaccount.google.com/apppasswords and update SMTP_PASS in backend/.env.\n`
      );
      err.isAuthError = true;
      err.authHelp = "Invalid Google App Password (535 BadCredentials). Please generate a 16-character App Password at https://myaccount.google.com/apppasswords and update SMTP_PASS in backend/.env.";
    }
    throw err;
  }
};

/**
 * Generate HTML template for interview invitation email with Zoom link and timing
 * @param {Object} data
 * @param {string} data.candidateName - Candidate's name
 * @param {string} data.jobTitle - Job title
 * @param {string} data.companyName - Company name
 * @param {string} [data.zoomLink] - Direct Zoom meeting URL
 * @param {string} [data.interviewTiming] - Scheduled date/time of interview
 * @param {string} [data.notes] - Additional instructions or notes
 * @param {string} [data.invitationUrl] - Secure candidate portal link
 * @returns {string} HTML email body
 */
const getInterviewInvitationEmailTemplate = ({
  candidateName,
  jobTitle,
  companyName,
  zoomLink,
  interviewTiming,
  notes,
  invitationUrl,
}) => {
  const timingText = interviewTiming || "Scheduled by recruiter (see details below)";
  const hasZoom = zoomLink && zoomLink.trim().length > 0;

  return `
    <div style="max-width: 620px; margin: 0 auto; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f1f5f9;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 36px 30px; border-radius: 14px 14px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">Talent Bridge</h1>
        <p style="color: #93c5fd; margin: 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em;">Official Interview Selection</p>
      </div>

      <div style="background: #ffffff; padding: 36px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 14px 14px; line-height: 1.6; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <p style="font-size: 17px; margin-top: 0; color: #0f172a;">
          Dear <strong>${candidateName || "Candidate"}</strong>,
        </p>

        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 6px; margin: 20px 0;">
          <h2 style="color: #1d4ed8; margin: 0 0 6px 0; font-size: 19px; font-weight: 700;">
            🎉 You Are Selected for an Interview!
          </h2>
          <p style="margin: 0; font-size: 15px; color: #1e3a8a;">
            Congratulations! After evaluating your profile and qualifications, you have been selected for the position of <strong>${jobTitle || "the role"}</strong> at <strong>${companyName || "Talent Bridge Partner"}</strong>.
          </p>
        </div>

        <!-- ── Interview Details Card ── -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 22px; margin: 26px 0;">
          <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 16px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            📅 Interview Schedule & Access
          </h3>

          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 35%; vertical-align: top;">Position:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${jobTitle || "Candidate Position"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; vertical-align: top;">Company:</td>
              <td style="padding: 8px 0; color: #0f172a;">${companyName || "Talent Bridge Partner"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; vertical-align: top;">Interview Timing:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700; font-size: 16px; color: #1e40af;">
                🕒 ${timingText}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; vertical-align: top;">Platform:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">
                <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 10px; border-radius: 4px; font-size: 13px;">Zoom Video Meeting</span>
              </td>
            </tr>
            ${
              notes
                ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; vertical-align: top;">Recruiter Note:</td>
              <td style="padding: 8px 0; color: #334155; font-style: italic;">${notes}</td>
            </tr>
            `
                : ""
            }
          </table>

          ${
            hasZoom
              ? `
          <div style="text-align: center; margin: 26px 0 16px 0;">
            <a href="${zoomLink.trim()}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 15px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
              📹 Join Zoom Meeting
            </a>
            <p style="font-size: 13px; color: #64748b; margin-top: 12px; margin-bottom: 0;">
              Zoom Link: <a href="${zoomLink.trim()}" style="color: #2563eb; word-break: break-all;">${zoomLink.trim()}</a>
            </p>
          </div>
          `
              : `
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 12px; border-radius: 6px; margin-top: 16px; font-size: 14px;">
            ⚠️ The recruiter will provide the direct Zoom link shortly before the meeting time.
          </div>
          `
          }
        </div>

        ${
          invitationUrl
            ? `
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;">
            You can also view your verified application details on the candidate portal:
          </p>
          <a href="${invitationUrl}" style="color: #2563eb; font-weight: 600; font-size: 14px; text-decoration: underline; word-break: break-all;">
            View Candidate Portal & Invitation Details
          </a>
        </div>
        `
            : ""
        }

        <p style="font-size: 14px; color: #475569; margin-top: 24px;">
          <strong>Preparation Tip:</strong> Please ensure your webcam and microphone are working properly, and connect 5 minutes prior to the scheduled time.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 26px 0;" />

        <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
          Warm regards,<br />
          <strong>${companyName || "Talent Bridge Partner"} Recruitment Team</strong><br />
          Powered by Talent Bridge
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
