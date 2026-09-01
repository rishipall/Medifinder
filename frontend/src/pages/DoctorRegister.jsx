import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

const CATEGORY_OPTIONS = [
  "Clinic",
  "Hospital",
  "Big Hospital",
  "Semi Gov Hospital",
  "Gov Hospital",
  "Private Hospital",
  "Nursing Home",
];

const PRESET_SPECIALIZATIONS = [
  { id: "heart", label: "Heart (Cardiology)", icon: "fa-heart-pulse" },
  { id: "brain", label: "Brain (Neurology)", icon: "fa-brain" },
  { id: "eye", label: "Eye (Ophthalmology)", icon: "fa-eye" },
  { id: "ear", label: "Ear (ENT)", icon: "fa-ear-listen" },
  { id: "general", label: "General Physician / Medicine", icon: "fa-user-doctor" },
  { id: "ortho", label: "Orthopedic", icon: "fa-bone" },
  { id: "pedia", label: "Pediatrics", icon: "fa-child" },
  { id: "derma", label: "Dermatology", icon: "fa-hand-dots" },
  { id: "gynae", label: "Gynaecology", icon: "fa-person-breastfeeding" },
  { id: "dental", label: "Dental (Dentist)", icon: "fa-tooth" },
];

const DoctorRegister = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    whatsapp: "",
    hospitalName: "",
    category: "Clinic",
    specialization: ["General Physician"],
    customSpecialization: "",
    degree: "MBBS",
    isGeneralPhysician: false,
    address: "",
    city: "",
    lat: "0",
    lng: "0",
    gstNumber: "",
    clinicDetails: "",
    educationDetails: "",
  });

  // UI state
  const [otpStep, setOtpStep] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    let val = value;
    setError("");

    // 1. Name Field Validation: No numbers allowed
    if (name === "name") {
      if (/\d/.test(val)) {
        val = val.replace(/\d/g, "");
        setError("Numbers/Digits are not allowed in Doctor Name field. ❌");
      }
    }

    // 2. City Field Validation: No numbers allowed
    if (name === "city") {
      if (/\d/.test(val)) {
        val = val.replace(/\d/g, "");
        setError("Numbers/Digits are not allowed in City field. ❌");
      }
    }

    // 3. Phone & WhatsApp Validation: Numbers only (digits 0-9)
    if (name === "phone" || name === "whatsapp") {
      if (/\D/.test(val)) {
        val = val.replace(/\D/g, "");
        setError(`Only numbers/digits are allowed in ${name === "phone" ? "Phone" : "WhatsApp"} contact field. ❌`);
      }
      if (val.length > 12) val = val.slice(0, 12);
    }

    // 4. GPS Coordinates Validation: Numbers/decimals only
    if (name === "lat" || name === "lng") {
      if (val !== "" && val !== "-" && val !== "." && val !== "-." && isNaN(Number(val))) {
        val = val.replace(/[^0-9.-]/g, "");
        setError(`Only numbers and decimal points are allowed for ${name === "lat" ? "Latitude" : "Longitude"}. ❌`);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const toggleSpecialization = (label) => {
    let updated = [...formData.specialization];
    if (updated.includes(label)) {
      updated = updated.filter((s) => s !== label);
    } else {
      updated.push(label);
    }
    setFormData((prev) => ({ ...prev, specialization: updated }));
  };

  const handleAddCustomSpec = () => {
    if (formData.customSpecialization.trim()) {
      const val = formData.customSpecialization.trim();
      if (!formData.specialization.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          specialization: [...prev.specialization, val],
          customSpecialization: "",
        }));
      }
    }
  };

  // Auto detect coordinates
  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
          }));
          setLoading(false);
        },
        (err) => {
          console.warn("Location error:", err.message);
          setError("Could not detect location automatically. Please enter coordinates manually.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Step 1: Send OTP to Doctor Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.hospitalName || !formData.degree || !formData.address || !formData.city) {
      setError("Please fill in all mandatory fields before sending OTP verification.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await API.post("/doctors/send-otp", {
        email: formData.email,
        phone: formData.phone,
      });

      if (res.data.success) {
        setOtpToken(res.data.otpToken);
        setOtpStep(true);
        setSuccessMsg(`OTP Code sent to ${formData.email}. Please check your inbox.`);
      } else {
        setError(res.data.message || "Failed to send verification OTP.");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      setError(err.response?.data?.message || "Server error sending OTP verification.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Verify OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setOtpLoading(true);

    try {
      const res = await API.post("/doctors/verify-otp", {
        otp: otpInput,
        otpToken,
      });

      if (res.data.success) {
        setOtpVerified(true);
        setOtpStep(false);
        setSuccessMsg("Email verified successfully! Now completing registration...");
        // Auto trigger full registration
        await finalizeRegistration();
      } else {
        setError(res.data.message || "Invalid OTP Code.");
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setError(err.response?.data?.message || "Verification failed. Check your OTP code.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Final Step: Submit Registration
  const finalizeRegistration = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        hospitalName: formData.hospitalName,
        category: formData.category,
        specialization: formData.specialization,
        degree: formData.degree,
        isGeneralPhysician: formData.isGeneralPhysician,
        address: formData.address,
        city: formData.city,
        lat: formData.lat,
        lng: formData.lng,
        gstNumber: formData.gstNumber,
        clinicDetails: formData.clinicDetails,
        educationDetails: formData.educationDetails,
        isVerified: true,
      };

      const res = await API.post("/doctors/register", payload);

      if (res.data && res.data.pendingApproval) {
        setSubmitted(true);
      } else {
        setError(res.data.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Doctor Registration Final Error:", err);
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-28 min-h-screen pb-20 max-w-2xl mx-auto px-4 text-center space-y-6">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-teal-500/40 bg-teal-950/20 shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center mx-auto text-teal-400 text-3xl animate-bounce">
            <i className="fa-solid fa-user-doctor"></i>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">Application Submitted!</h1>
            <p className="text-teal-300 font-semibold text-sm">
              Thank you Dr. {formData.name}! Your Doctor / Hospital profile has been submitted successfully.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs text-left leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <i className="fa-solid fa-hourglass-half"></i>
              <span>Super Admin Approval Pending</span>
            </div>
            <p>
              Your email address (<strong>{formData.email}</strong>) has been verified. To maintain healthcare provider standards, your profile is now in queue for Super Admin review. You will be able to log in to your dashboard once approved.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/doctor/login"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20 transition-all"
            >
              Go to Doctor Login
            </Link>

            <Link
              to="/"
              className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold tracking-wider text-teal-400 uppercase bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
          <i className="fa-solid fa-stethoscope mr-1.5"></i>
          Healthcare Practitioner Portal
        </span>
        <h1 className="text-3xl font-extrabold text-white">Register Doctor / Hospital Profile</h1>
        <p className="text-slate-400 text-xs">
          Register your clinic or hospital to receive patient calls, WhatsApp queries, and direct AI Consult referrals.
        </p>
      </div>

      {/* Main Glass Form */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 space-y-8 shadow-2xl relative">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400 text-base"></i>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/50 text-teal-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-teal-400 text-base"></i>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSendOtp} className="space-y-8">
          
          {/* Section 1: Doctor Personal & Account Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <i className="fa-solid fa-user"></i>
              <span>1. Doctor Credentials & Account Info</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address (for OTP Verification) *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="doctor@hospital.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  <i className="fa-solid fa-phone text-teal-400 mr-1"></i>
                  Direct Call Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  <i className="fa-brands fa-whatsapp text-emerald-400 mr-1"></i>
                  WhatsApp Number (For Direct Patient Chat)
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  placeholder="e.g. 9876543210 (Leave blank if same as phone)"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Hospital / Clinic & Specializations */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <i className="fa-solid fa-hospital"></i>
              <span>2. Clinic / Hospital Details & Specialization</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital / Clinic Name *</label>
                <input
                  type="text"
                  name="hospitalName"
                  required
                  placeholder="e.g. Metro Heart & Multi-Speciality Hospital"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Degree / Qualification *</label>
                <input
                  type="text"
                  name="degree"
                  required
                  placeholder="e.g. MBBS, MD (Cardiology), BAMS"
                  value={formData.degree}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">GST / Medical License Reg No.</label>
                <input
                  type="text"
                  name="gstNumber"
                  placeholder="e.g. 07AAAAA0000A1Z5 or Reg No."
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white uppercase focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            {/* General Physician Checkbox */}
            <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex items-center gap-3">
              <input
                type="checkbox"
                id="isGeneralPhysician"
                name="isGeneralPhysician"
                checked={formData.isGeneralPhysician}
                onChange={handleChange}
                className="w-5 h-5 accent-teal-400 rounded cursor-pointer"
              />
              <label htmlFor="isGeneralPhysician" className="text-xs font-bold text-teal-200 cursor-pointer">
                I am a General Physician (Can handle all normal/general patient health complaints)
              </label>
            </div>

            {/* Specialization selection pills */}
            <div className="space-y-2 text-xs">
              <label className="block text-slate-300 font-semibold">Select Specialization(s):</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SPECIALIZATIONS.map((item) => {
                  const isSel = formData.specialization.includes(item.label);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSpecialization(item.label)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                        isSel
                          ? "bg-teal-500 text-slate-950 border-teal-400 font-extrabold shadow-md shadow-teal-500/20"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:border-teal-500/40"
                      }`}
                    >
                      <i className={`fa-solid ${item.icon}`}></i>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Specialization */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Or type custom specialization..."
                  value={formData.customSpecialization}
                  onChange={(e) => setFormData({ ...formData, customSpecialization: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSpec}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Location & Address */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-location-dot"></i>
                <span>3. Location Coordinates & Address</span>
              </h2>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <i className="fa-solid fa-location-crosshairs"></i>
                <span>Auto Detect GPS Coordinates</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="e.g. Delhi, Mumbai, Bengaluru"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Clinic / Hospital Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="e.g. Block C, Sector 62, Opp. Metro Station"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Latitude Coordinate</label>
                <input
                  type="text"
                  name="lat"
                  placeholder="e.g. 28.6139"
                  value={formData.lat}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Longitude Coordinate</label>
                <input
                  type="text"
                  name="lng"
                  placeholder="e.g. 77.2090"
                  value={formData.lng}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Clinic Bio & Education */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <i className="fa-solid fa-graduation-cap"></i>
              <span>4. Education & Clinic Overview</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Education & Qualification Details</label>
                <textarea
                  name="educationDetails"
                  rows={3}
                  placeholder="e.g. MBBS from AIIMS Delhi, MD in Cardiology ( Gold Medalist ), 12+ years experience..."
                  value={formData.educationDetails}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Clinic Timings & Facilities</label>
                <textarea
                  name="clinicDetails"
                  rows={3}
                  placeholder="e.g. Mon-Sat: 10:00 AM - 8:00 PM. ECG, Echo, Emergency ICU available 24/7..."
                  value={formData.clinicDetails}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={otpLoading || loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {otpLoading ? (
              <>
                <i className="fa-solid fa-spinner animate-spin"></i>
                <span>Sending Email OTP...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-envelope-circle-check text-base"></i>
                <span>Verify Email via OTP & Submit Registration</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* OTP Verification Modal */}
      {otpStep && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-teal-500/50 max-w-md w-full space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto text-2xl border border-teal-500/40">
                <i className="fa-solid fa-envelope-open-text"></i>
              </div>
              <h3 className="text-xl font-bold text-white">Enter 6-Digit Email OTP</h3>
              <p className="text-xs text-slate-300">
                A verification code was sent to <strong className="text-teal-400">{formData.email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-900 border border-teal-500/50 rounded-2xl py-3 px-4 text-center text-2xl font-extrabold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={otpLoading || loading}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20"
                >
                  {otpLoading || loading ? "Verifying..." : "Verify Code & Complete"}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="px-4 py-3.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold border border-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorRegister;
