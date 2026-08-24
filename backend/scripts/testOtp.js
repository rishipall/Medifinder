const axios = require("axios");

const testOtpFlow = async () => {
  try {
    console.log("Testing POST /api/auth/send-otp ...");
    const sendRes = await axios.post("http://localhost:5000/api/auth/send-otp", {
      phone: "+919876543210",
      email: "teststore@medifind.com"
    });

    console.log("Send OTP Response:", sendRes.data);

    if (sendRes.data.success && sendRes.data.otpToken) {
      console.log("\nToken generated successfully! OTP backend flow works! ✅");
    } else {
      console.error("Failed to generate OTP token");
    }
  } catch (err) {
    console.error("OTP Test Error:", err.response?.data || err.message);
  }
};

testOtpFlow();
