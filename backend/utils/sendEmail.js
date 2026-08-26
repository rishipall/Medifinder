const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const dns = require("dns");
const fs = require("fs");
const path = require("path");
const https = require("https");

dotenv.config();

// Force IPv4 DNS Resolution across Node process
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Helper to dispatch HTTPS API request to Brevo (Sendinblue) using Node native https module.
 * Brevo allows sending 300 free emails/day to ANY recipient email address on Render!
 */
const postBrevoApi = (apiKey, toEmail, senderEmail, htmlContent, subject) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      sender: { name: "MediFind Pharmacy", email: senderEmail || "noreply@medifind.com" },
      to: [{ email: toEmail }],
      subject: subject || "🔐 Your MediFind Store Verification OTP Code",
      htmlContent: htmlContent,
    });

    const req = https.request(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 10000,
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, status: res.statusCode, body: responseBody });
          } else {
            resolve({ ok: false, status: res.statusCode, body: responseBody });
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Brevo HTTPS timeout after 10s"));
    });

    req.write(postData);
    req.end();
  });
};

/**
 * Sends Email OTP directly to the exact Recipient Email typed by the user.
 */
const sendEmail = async (email, subject, otpCode) => {
  const cleanEmail = (email || "").toLowerCase().trim();

  let emailUser = (process.env.EMAIL_USER || "").trim();
  let emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();
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

  console.log("\n=======================================================");
  console.log(`📧 [EMAIL OTP DISPATCH LOG]`);
  console.log(`   Recipient Email : ${cleanEmail}`);
  console.log(`   Sender Account  : ${emailUser || "MediFind System"}`);
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

  // 🚀 METHOD 1: Brevo HTTPS API (Sends directly to cleanEmail recipient)
  if (brevoKey) {
    try {
      const brevoResult = await postBrevoApi(brevoKey, cleanEmail, emailUser, htmlContent, subject);

      if (brevoResult.ok) {
        console.log(`✅ Email OTP sent successfully via Brevo HTTPS API to ${cleanEmail}`);
        return true;
      }
      console.warn(`⚠️ Brevo API status ${brevoResult.status}: ${brevoResult.body}`);
    } catch (apiErr) {
      console.warn(`⚠️ Brevo HTTPS API error: ${apiErr.message}`);
    }
  }

  // 🚀 METHOD 2: Nodemailer SMTP (Sends directly to cleanEmail recipient)
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
