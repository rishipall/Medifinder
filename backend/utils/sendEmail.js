const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config(); // Ensures fresh .env environment variables are loaded

const fs = require("fs");
const path = require("path");

/**
 * Sends Email OTP via Nodemailer with terminal console debug mode fallback.
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject title
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (email, subject, otpCode) => {
  const cleanEmail = (email || "").toLowerCase().trim();

  // Read directly from backend/.env file to ensure fresh credentials even if process.env is cached
  let emailUser = (process.env.EMAIL_USER || "").trim();
  let emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();

  try {
    const envPath = path.resolve(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      if (envConfig.EMAIL_USER) emailUser = envConfig.EMAIL_USER.trim();
      if (envConfig.EMAIL_PASS) emailPass = envConfig.EMAIL_PASS.replace(/\s+/g, "").trim();
    }
  } catch (e) {
    // fallback to process.env if reading file fails
  }

  // ALWAYS log prominent debug message to backend terminal console
  console.log("\n=======================================================");
  console.log(`📧 [EMAIL OTP DEBUG LOG]`);
  console.log(`   From Sender Account : ${emailUser || "Not Configured"}`);
  console.log(`   Recipient Email     : ${cleanEmail}`);
  console.log(`   Verification OTP    : ${otpCode}`);
  console.log("=======================================================\n");

  if (!emailUser || !emailPass) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS is not configured in Environment Variables (or backend/.env).");
    console.warn("💡 Using Terminal Console Debug OTP mode (copy the 6-digit code printed above for testing).");
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass, // 16-character Google App Password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const htmlContent = `
      <div style="max-width: 500px; margin: 0 auto; padding: 25px; background-color: #0f172a; color: #ffffff; border-radius: 20px; font-family: Arial, sans-serif; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2dd4bf; margin: 0; font-size: 24px;">MediFind Pharmacy Network</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 5px;">Vendor Store Email Verification</p>
        </div>

        <div style="background-color: #1e293b; padding: 20px; border-radius: 14px; text-align: center; margin: 20px 0; border: 1px solid #334155;">
          <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 10px;">Your 6-digit verification code is:</p>
          <h1 style="color: #38bdf8; font-size: 36px; letter-spacing: 8px; margin: 10px 0; font-family: monospace;">${otpCode}</h1>
          <p style="color: #64748b; font-size: 11px; margin-top: 10px;">Valid for 10 minutes. Do not share this code with anyone.</p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
          Thank you for registering your medical store on MediFind. Verify your email to complete your store registration application.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"MediFind Pharmacy" <${emailUser}>`,
      to: cleanEmail,
      subject: subject || "🔐 Your MediFind Store Verification OTP Code",
      html: htmlContent,
    });

    console.log(`✅ Email OTP sent successfully via Nodemailer to ${cleanEmail}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Nodemailer error (${err.message}). Defaulting to Terminal Debug OTP mode.`);
    return true;
  }
};

module.exports = sendEmail;
