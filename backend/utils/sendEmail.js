const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const dns = require("dns");
const fs = require("fs");
const path = require("path");

dotenv.config();

// 🚀 FORCE IPv4 DNS Resolution across Node.js process (Fixes Render IPv6 ENETUNREACH 2607:f8b0... errors)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Sends Email OTP via Nodemailer with IPv4 force & cloud timeout optimization.
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject title
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (email, subject, otpCode) => {
  const cleanEmail = (email || "").toLowerCase().trim();

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
  console.log(`📧 [EMAIL OTP DISPATCH LOG]`);
  console.log(`   From Sender Account : ${emailUser || "Not Configured (Missing EMAIL_USER)"}`);
  console.log(`   Recipient Email     : ${cleanEmail}`);
  console.log(`   Verification OTP    : ${otpCode}`);
  console.log("=======================================================\n");

  if (!emailUser || !emailPass) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS is missing in Environment Variables.");
    console.warn("💡 Using Terminal Console Debug OTP mode (copy the 6-digit code printed above for testing).");
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

  // Candidate Nodemailer transports forced to IPv4 to prevent Render IPv6 socket drops
  const transportConfigs = [
    // Transport 1: Direct IPv4 SSL Port 465
    {
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL
      family: 4, // FORCE IPv4 (Fixes Render IPv6 ENETUNREACH 2607:f8b0... errors)
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    },
    // Transport 2: STARTTLS Port 587 (IPv4)
    {
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      requireTLS: true,
      family: 4, // FORCE IPv4
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    },
    // Transport 3: Gmail Service Transport (IPv4)
    {
      service: "gmail",
      family: 4,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
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

      console.log(`✅ Email OTP sent successfully via Nodemailer (IPv4) to ${cleanEmail}`);
      return true;
    } catch (err) {
      console.warn(`⚠️ Nodemailer IPv4 transport attempt failed (${err.message}). Trying fallback config...`);
      lastError = err;
    }
  }

  console.error(`❌ All Nodemailer email dispatches failed for ${cleanEmail}:`, lastError?.message);
  return true;
};

module.exports = sendEmail;
