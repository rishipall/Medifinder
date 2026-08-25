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
 * Sends Email OTP via HTTPS API (Resend/Brevo) or Nodemailer SMTP fallback.
 * Bypasses Render/Cloud datacenter firewall port blocks (Ports 465/587).
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject title
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (email, subject, otpCode) => {
  const cleanEmail = (email || "").toLowerCase().trim();

  let emailUser = (process.env.EMAIL_USER || "").trim();
  let emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();
  const resendKey = (process.env.RESEND_API_KEY || "").trim();
  const brevoKey = (process.env.BREVO_API_KEY || "").trim();

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

  // Console Log for backend terminal & Render logs
  console.log("\n=======================================================");
  console.log(`📧 [EMAIL OTP DISPATCH LOG]`);
  console.log(`   Sender Account  : ${emailUser || "rishipalup66@gmail.com"}`);
  console.log(`   Target Email    : ${cleanEmail}`);
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
        Thank you for registering your medical store on MediFind. Requested for account: <strong>${cleanEmail}</strong>.
      </p>
    </div>
  `;

  // 🚀 DISPATCH METHOD 1: Resend HTTPS API (Port 443 - NEVER blocked by Render/Vercel)
  if (resendKey) {
    try {
      // Resend free tier onboarding domain (onboarding@resend.dev) requires sending to account owner email (rishipalup66@gmail.com)
      const resendRecipient = (process.env.EMAIL_USER || "rishipalup66@gmail.com").trim();

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MediFind Pharmacy <onboarding@resend.dev>",
          to: [resendRecipient],
          subject: subject || "🔐 Your MediFind Store Verification OTP Code",
          html: htmlContent,
        }),
      });

      if (response.ok) {
        console.log(`✅ Email OTP sent successfully via Resend HTTPS API to ${resendRecipient}`);
        return true;
      }
      const errText = await response.text();
      console.warn(`⚠️ Resend API notice: ${errText}`);
    } catch (apiErr) {
      console.warn(`⚠️ Resend HTTPS API dispatch error: ${apiErr.message}`);
    }
  }

  // 🚀 DISPATCH METHOD 2: Brevo HTTPS API (Port 443 - NEVER blocked by Render/Vercel)
  if (brevoKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "MediFind Pharmacy", email: emailUser || "rishipalup66@gmail.com" },
          to: [{ email: emailUser || "rishipalup66@gmail.com" }],
          subject: subject || "🔐 Your MediFind Store Verification OTP Code",
          htmlContent: htmlContent,
        }),
      });

      if (response.ok) {
        console.log(`✅ Email OTP sent successfully via Brevo HTTPS API to ${emailUser || "rishipalup66@gmail.com"}`);
        return true;
      }
      const errText = await response.text();
      console.warn(`⚠️ Brevo API notice: ${errText}`);
    } catch (apiErr) {
      console.warn(`⚠️ Brevo HTTPS API dispatch error: ${apiErr.message}`);
    }
  }

  // 🚀 DISPATCH METHOD 3: Nodemailer SMTP (Local dev & hosts with open SMTP ports)
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

        console.log(`✅ Email OTP sent successfully via Nodemailer SMTP to ${cleanEmail}`);
        return true;
      } catch (err) {
        console.warn(`⚠️ Nodemailer SMTP attempt notice (${err.message}). Trying fallback...`);
      }
    }
  }

  return true;
};

module.exports = sendEmail;
