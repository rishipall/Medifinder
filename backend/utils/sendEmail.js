const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");
const path = require("path");

/**
 * Sends Email OTP via Nodemailer with robust multi-transport fallback for Render/Vercel/Cloud platforms.
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject title
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (email, subject, otpCode) => {
  const cleanEmail = (email || "").toLowerCase().trim();

  // Read environment variables (supports Render / Vercel process.env as well as local .env)
  let emailUser = (process.env.EMAIL_USER || "").trim();
  let emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();

  try {
    const envPath = path.resolve(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      if (envConfig.EMAIL_USER && !emailUser) emailUser = envConfig.EMAIL_USER.trim();
      if (envConfig.EMAIL_PASS && !emailPass) emailPass = envConfig.EMAIL_PASS.replace(/\s+/g, "").trim();
    }
  } catch (e) {
    // fallback to process.env
  }

  // Debug log on server console
  console.log("\n=======================================================");
  console.log(`📧 [EMAIL OTP DEBUG LOG]`);
  console.log(`   From Sender Account : ${emailUser || "Not Configured (Missing EMAIL_USER)"}`);
  console.log(`   Recipient Email     : ${cleanEmail}`);
  console.log(`   Verification OTP    : ${otpCode}`);
  console.log("=======================================================\n");

  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

  if (!emailUser || !emailPass) {
    const missingMsg = "⚠️ EMAIL_USER or EMAIL_PASS is missing in Environment Variables. Please add EMAIL_USER and EMAIL_PASS in your Render Dashboard settings.";
    console.warn(missingMsg);
    
    if (isProduction) {
      throw new Error("EMAIL_USER or EMAIL_PASS is not configured in Render Environment Variables. Please add EMAIL_USER and EMAIL_PASS in Render Environment settings.");
    }
    
    console.warn("💡 Local Dev Mode: Copy the 6-digit OTP code printed in terminal above to verify.");
    return true;
  }

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

  // Candidate Nodemailer transports to ensure compatibility across cloud platforms (Render, Vercel, Railway, AWS)
  const transportConfigs = [
    // Config 1: Gmail Service Transport (Recommended for Gmail App Passwords)
    {
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
      connectionTimeout: 12000,
    },
    // Config 2: Explicit SSL Port 465
    {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
      connectionTimeout: 12000,
    },
    // Config 3: STARTTLS Port 587 (IPv4 forced)
    {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      family: 4,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 12000,
    }
  ];

  let lastError = null;

  for (const config of transportConfigs) {
    try {
      const transporter = nodemailer.createTransport(config);
      await transporter.sendMail({
        from: `"MediFind Pharmacy" <${emailUser}>`,
        to: cleanEmail,
        subject: subject || "🔐 Your MediFind Store Verification OTP Code",
        html: htmlContent,
      });

      console.log(`✅ Email OTP sent successfully via Nodemailer to ${cleanEmail}`);
      return true;
    } catch (err) {
      console.warn(`⚠️ Nodemailer transport attempt failed (${err.message}). Trying fallback transport...`);
      lastError = err;
    }
  }

  console.error(`❌ All Nodemailer email dispatches failed for ${cleanEmail}:`, lastError?.message);

  if (isProduction || (emailUser && emailPass)) {
    throw new Error(`Email delivery failed: ${lastError?.message || "Invalid credentials or SMTP port blocked"}. Please verify your EMAIL_USER & EMAIL_PASS in Render settings.`);
  }

  return true;
};

module.exports = sendEmail;
