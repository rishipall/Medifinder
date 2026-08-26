const { Resend } = require("resend");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const dns = require("dns");
const fs = require("fs");
const path = require("path");

dotenv.config();

// Force IPv4 DNS Resolution across Node process
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Sends Email OTP using Resend API as primary delivery method,
 * falling back to Nodemailer SMTP if Resend is not configured or fails.
 */
const sendEmail = async (email, subject, otpCode) => {
  const cleanEmail = (email || "").toLowerCase().trim();

  let resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  let emailUser = (process.env.EMAIL_USER || "").trim();
  let emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();

  // Safety fallback read directly from backend/.env file if process.env wasn't updated yet
  try {
    const envPath = path.resolve(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      if (envConfig.RESEND_API_KEY && !resendApiKey) resendApiKey = envConfig.RESEND_API_KEY.trim();
      if (envConfig.EMAIL_USER && !emailUser) emailUser = envConfig.EMAIL_USER.trim();
      if (envConfig.EMAIL_PASS && !emailPass) emailPass = envConfig.EMAIL_PASS.replace(/\s+/g, "").trim();
    }
  } catch (e) {
    // fallback to process.env
  }

  console.log("\n=======================================================");
  console.log(`📧 [EMAIL OTP DISPATCH LOG]`);
  console.log(`   Recipient Email : ${cleanEmail}`);
  console.log(`   Verification OTP: ${otpCode}`);
  console.log("=======================================================\n");

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
        Thank you for registering your medical store on MediFind.
      </p>
    </div>
  `;

  // 🚀 PRIMARY METHOD: Resend API (Fast, Reliable, Bypasses Cloud Host SMTP Port Blocks)
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: "MediFind Pharmacy <onboarding@resend.dev>",
        to: [cleanEmail],
        subject: subject || "🔐 Your MediFind Store Verification OTP Code",
        html: htmlContent,
      });

      if (!error && data) {
        console.log(`✅ Email OTP sent successfully via Resend API to ${cleanEmail} (ID: ${data.id})`);
        return true;
      }
      
      console.warn(`⚠️ Resend API notice: ${error ? error.message : "No data returned"}. Trying fallback...`);
    } catch (resendErr) {
      console.warn(`⚠️ Resend API exception: ${resendErr.message}. Trying fallback...`);
    }
  }

  // 🚀 FALLBACK METHOD: Nodemailer SMTP
  if (emailUser && emailPass) {
    const transportConfigs = [
      {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        family: 4,
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
      },
      {
        service: "gmail",
        family: 4,
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 8000,
      }
    ];

    for (const config of transportConfigs) {
      try {
        const transporter = nodemailer.createTransport(config);
        await transporter.sendMail({
          from: `"MediFind Pharmacy" <${emailUser}>`,
          to: cleanEmail,
          subject: subject || "🔐 Your MediFind Store Verification OTP Code",
          html: htmlContent,
        });

        console.log(`✅ Email OTP sent successfully via Nodemailer SMTP fallback to ${cleanEmail}`);
        return true;
      } catch (err) {
        console.warn(`⚠️ Nodemailer SMTP fallback notice (${err.message}).`);
      }
    }
  }

  return true;
};

module.exports = sendEmail;
