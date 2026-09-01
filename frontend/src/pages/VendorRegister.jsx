import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

const VendorRegister = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    phone: "",
    gstNumber: "",
    address: "",
    city: "",
    lat: "",
    lng: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    // Disallow whitespace in strict fields
    if (["email", "password", "phone", "gstNumber", "lat", "lng"].includes(name) && /\s/.test(val)) {
      setError("White space / Spaces are not allowed in this input field. ❌");
      return;
    }

    setError("");

    // 1. Owner Name Validation: No numbers allowed
    if (name === "name") {
      if (/\d/.test(val)) {
        val = val.replace(/\d/g, "");
        setError("Numbers/Digits are not allowed in Owner Name field. ❌");
      }
    }

    // 2. City Validation: No numbers allowed
    if (name === "city") {
      if (/\d/.test(val)) {
        val = val.replace(/\d/g, "");
        setError("Numbers/Digits are not allowed in City field. ❌");
      }
    }

    // 3. Phone validation: numbers only
    if (name === "phone") {
      if (/[^\d]/.test(val)) {
        val = val.replace(/\D/g, "");
        setError("Please input numbers only for contact phone number. ❌");
      }
    }

    // 4. GST Number validation & uppercase conversion
    if (name === "gstNumber") {
      const upper = val.toUpperCase();
      if (/[^0-9A-Z]/.test(upper)) {
        setError("Please input valid alphanumeric characters for GST Number. ❌");
        return;
      }
      setForm({ ...form, [name]: upper });
      return;
    }

    // 5. GPS Latitude / Longitude validation: numeric decimal
    if (name === "lat" || name === "lng") {
      if (val !== "" && val !== "-" && val !== "." && val !== "-." && isNaN(Number(val))) {
        val = val.replace(/[^0-9.-]/g, "");
        setError(`Please input numbers only for ${name === "lat" ? "Latitude" : "Longitude"}. ❌`);
      }
    }

    setForm({ ...form, [name]: val });
  };

  // Auto-Detect Current Store GPS Location Coordinates
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      (err) => {
        setError(`Could not auto-detect GPS location (${err.message}). Please enter coordinates manually.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 60-second Countdown Timer for Resending OTP
  useEffect(() => {
    let interval = null;
    if (showOtpModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, resendTimer]);

  // Step 1: Send Email OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.email || !form.email.includes("@")) {
      setError("Please enter a valid email address for verification.");
      setLoading(false);
      return;
    }

    if (!form.phone || form.phone.trim().length < 10) {
      setError("Please enter a valid 10-digit numeric phone number. ❌");
      setLoading(false);
      return;
    }

    if (form.gstNumber && form.gstNumber.trim().length > 0 && form.gstNumber.trim().length !== 15) {
      setError("Please enter a valid 15-character GSTIN number (e.g. 22AAAAA0000A1Z5). ❌");
      setLoading(false);
      return;
    }

    try {
      const { data } = await API.post("/auth/send-otp", {
        email: form.email,
        phone: form.phone,
      });

      if (data.success && data.otpToken) {
        setOtpToken(data.otpToken);
        setShowOtpModal(true);
        setResendTimer(60);
        setCanResend(false);
        setOtpError("");
      } else {
        setError(data.message || "Could not send email verification OTP.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || (err.message === "Network Error" ? "Network Error: Cannot reach MediFind backend server. If accessing from a mobile network or different Wi-Fi, ensure your backend server is deployed or using a public URL." : "Failed to send email OTP. Please check your email address.");
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Email OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      const { data } = await API.post("/auth/send-otp", {
        email: form.email,
        phone: form.phone,
      });
      if (data.success && data.otpToken) {
        setOtpToken(data.otpToken);
        setResendTimer(60);
        setCanResend(false);
        setOtpError("✅ A new verification code has been sent to your email!");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || (err.message === "Network Error" ? "Network Error: Cannot reach backend server." : "Failed to resend OTP.");
      setOtpError(errMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Verify OTP & Submit Registration Application
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const verifyRes = await API.post("/auth/verify-otp", {
        otp: otpCode.trim(),
        otpToken,
      });

      if (verifyRes.data?.success) {
        await API.post("/auth/register", {
          ...form,
          isVerified: true,
        });

        setShowOtpModal(false);
        setIsSubmittedSuccess(true);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid or expired OTP code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const fields = [
    { name: "name", label: "Owner Full Name", placeholder: "John Doe", icon: "fa-user" },
    { name: "email", label: "Email Address (for Email OTP)", placeholder: "store@pharmacy.com", type: "email", icon: "fa-envelope" },
    { name: "password", label: "Password", placeholder: "Min 6 characters", type: "password", icon: "fa-lock" },
    { name: "storeName", label: "Pharmacy / Store Name", placeholder: "Apollo Pharmacy", icon: "fa-house-medical" },
    { name: "phone", label: "Contact Phone Number", placeholder: "9876543210", type: "text", inputMode: "numeric", icon: "fa-phone" },
    { name: "gstNumber", label: "GSTIN / GST Number (Optional)", placeholder: "22AAAAA0000A1Z5", type: "text", icon: "fa-receipt" },
    { name: "address", label: "Store Address", placeholder: "123, MG Road", icon: "fa-map-pin" },
    { name: "city", label: "City", placeholder: "Varanasi", icon: "fa-city" },
  ];

  if (isSubmittedSuccess) {
    return (
      <div className="pt-28 min-h-screen flex items-center justify-center p-4 pb-20">
        <div className="glass-panel w-full max-w-lg rounded-3xl border border-amber-500/40 p-8 space-y-6 shadow-2xl text-center relative overflow-hidden bg-amber-950/10">
          
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/50 text-amber-400 text-3xl font-bold flex items-center justify-center animate-pulse">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40 flex items-center justify-center w-fit mx-auto gap-1.5">
              <i className="fa-solid fa-envelope-circle-check"></i>
              <span>Email Verified & Submitted ✅</span>
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-2">Pending Super Admin Approval</h2>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Thank you for registering <strong className="text-amber-300 font-bold">{form.storeName}</strong>! Email <strong className="text-teal-300 font-bold">{form.email}</strong> verified successfully. Your application has been sent to Super Admin for approval.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 space-y-1 text-left">
            <div className="font-bold text-white flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info text-amber-400"></i>
              <span>Next Steps:</span>
            </div>
            <p>• Super Admin will review your medical store registration details.</p>
            <p>• Once approved by Super Admin, you will be able to log in with your email and password.</p>
          </div>

          <button
            onClick={() => navigate("/vendor/login")}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-to-bracket"></i>
            <span>Go to Login Page</span>
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center p-4 pb-20 relative">

      <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-700/80 p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 text-2xl font-bold">
            <i className="fa-solid fa-hospital-user"></i>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Register Pharmacy Store</h2>
          <p className="text-xs text-slate-400">List your medicine inventory with Email OTP verification.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{f.label}</label>
                <div className="relative">
                  <i className={`fa-solid ${f.icon} absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs`}></i>
                  <input
                    type={f.type || "text"}
                    inputMode={f.inputMode}
                    name={f.name}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={handleChange}
                    required={f.name !== "gstNumber"}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* GPS Coordinates Auto-Detect */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                GPS Location Coordinates
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="text-xs text-teal-400 font-bold hover:underline flex items-center gap-1 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/30 active:scale-95 transition-all"
              >
                {locating ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-location-crosshairs text-teal-400"></i>
                    <span>📍 Auto-Detect My Store GPS</span>
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                inputMode="decimal"
                name="lat"
                placeholder="Latitude (e.g. 25.3176)"
                value={form.lat}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
              <input
                type="text"
                inputMode="decimal"
                name="lng"
                placeholder="Longitude (e.g. 82.9739)"
                value={form.lng}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner animate-spin"></i>
                <span>Sending Email OTP...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-envelope"></i>
                <span>Send Email OTP & Verify Store →</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2">
          Already registered?{" "}
          <Link to="/vendor/login" className="text-teal-400 font-bold hover:underline">
            Login here
          </Link>
        </p>

      </div>

      {/* 📧 Interactive Email OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-teal-500/40 p-6 space-y-5 shadow-2xl bg-slate-900/95 relative animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-400 text-2xl font-bold flex items-center justify-center">
                <i className="fa-solid fa-envelope-circle-check"></i>
              </div>
              <h3 className="text-xl font-extrabold text-white">Enter Email Verification Code</h3>
              <p className="text-xs text-slate-300">
                A 6-digit OTP code has been sent to your email address:
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 font-bold text-xs">
                📧 {form.email}
              </div>
            </div>

            {otpError && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                otpError.startsWith("✅") ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300" : "bg-rose-950/60 border border-rose-500/50 text-rose-200"
              }`}>
                <i className={`fa-solid ${otpError.startsWith("✅") ? "fa-circle-check text-emerald-400" : "fa-triangle-exclamation text-rose-400"}`}></i>
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="8 4 9 2 0 1"
                  required
                  autoFocus
                  className="w-full text-center tracking-[12px] font-mono text-2xl font-bold bg-slate-950 border border-teal-500/50 rounded-2xl py-3 text-teal-300 focus:border-teal-400 focus:outline-none shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Didn't receive code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpLoading}
                    className="text-teal-400 font-bold hover:underline"
                  >
                    Resend Email OTP
                  </button>
                ) : (
                  <span className="text-slate-500 font-mono">Resend in {resendTimer}s</span>
                )}
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpCode.length < 6}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm hover:brightness-110 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Verify Code & Submit Registration →</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default VendorRegister;
