const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true }, // Call contact number
    whatsapp: { type: String, default: "", trim: true }, // WhatsApp contact number
    hospitalName: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Clinic", "Hospital", "Big Hospital", "Semi Gov Hospital", "Gov Hospital", "Private Hospital", "Nursing Home"],
      default: "Clinic",
    },
    specialization: {
      type: [String],
      default: ["General Physician"],
    },
    degree: { type: String, required: true, trim: true }, // e.g. MBBS, BAMS, MD, MS, BDS, BHMS
    isGeneralPhysician: { type: Boolean, default: false }, // Can handle all general patient types
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    gstNumber: { type: String, default: "", trim: true, uppercase: true },
    clinicDetails: { type: String, default: "", trim: true }, // Description, timings, services
    educationDetails: { type: String, default: "", trim: true }, // Qualifications, medical college, experience
    isApproved: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    sessionToken: { type: String, default: null },
  },
  { timestamps: true }
);

doctorSchema.index({ phone: 1 });
doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ category: 1 });
doctorSchema.index({ specialization: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);
