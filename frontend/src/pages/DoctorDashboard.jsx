import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

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
  "Heart (Cardiology)",
  "Brain (Neurology)",
  "Eye (Ophthalmology)",
  "Ear (ENT)",
  "General Physician / Medicine",
  "Orthopedic",
  "Pediatrics",
  "Dermatology",
  "Gynaecology",
  "Dental (Dentist)",
];

const DoctorDashboard = () => {
  const { doctor, logoutDoctor } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    hospitalName: "",
    category: "Clinic",
    specialization: [],
    customSpec: "",
    degree: "",
    isGeneralPhysician: false,
    address: "",
    city: "",
    lat: "0",
    lng: "0",
    gstNumber: "",
    clinicDetails: "",
    educationDetails: "",
  });

  useEffect(() => {
    if (!doctor) {
      navigate("/doctor/login");
    } else {
      fetchDoctorProfile();
    }
  }, [doctor, navigate]);

  const fetchDoctorProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("doctorToken");
      const { data } = await API.get("/doctors/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = data.doctor;
      setProfile(d);
      setForm({
        name: d.name || "",
        phone: d.phone || "",
        whatsapp: d.whatsapp || d.phone || "",
        hospitalName: d.hospitalName || "",
        category: d.category || "Clinic",
        specialization: d.specialization || ["General Physician"],
        customSpec: "",
        degree: d.degree || "",
        isGeneralPhysician: Boolean(d.isGeneralPhysician),
        address: d.address || "",
        city: d.city || "",
        lat: d.lat !== undefined ? d.lat.toString() : "0",
        lng: d.lng !== undefined ? d.lng.toString() : "0",
        gstNumber: d.gstNumber || "",
        clinicDetails: d.clinicDetails || "",
        educationDetails: d.educationDetails || "",
      });
    } catch (err) {
      console.error("Fetch doctor profile error:", err);
      showToast("Failed to load doctor profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  const handleInputChange = (field, value) => {
    let val = value;

    if (field === "name") {
      if (/\d/.test(val)) {
        val = val.replace(/\d/g, "");
        showToast("Numbers/Digits are not allowed in Doctor Name field. ❌", "error");
      }
    }

    if (field === "city") {
      if (/\d/.test(val)) {
        val = val.replace(/\d/g, "");
        showToast("Numbers/Digits are not allowed in City field. ❌", "error");
      }
    }

    if (field === "phone" || field === "whatsapp") {
      if (/\D/.test(val)) {
        val = val.replace(/\D/g, "");
        showToast(`Only numbers/digits are allowed in ${field === "phone" ? "Phone" : "WhatsApp"} field. ❌`, "error");
      }
      if (val.length > 12) val = val.slice(0, 12);
    }

    if (field === "lat" || field === "lng") {
      if (val !== "" && val !== "-" && val !== "." && val !== "-." && isNaN(Number(val))) {
        val = val.replace(/[^0-9.-]/g, "");
        showToast(`Only numbers and decimal points are allowed for ${field === "lat" ? "Latitude" : "Longitude"}. ❌`, "error");
      }
    }

    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const toggleSpec = (spec) => {
    let updated = [...form.specialization];
    if (updated.includes(spec)) {
      updated = updated.filter((s) => s !== spec);
    } else {
      updated.push(spec);
    }
    setForm({ ...form, specialization: updated });
  };

  const handleAddCustomSpec = () => {
    if (form.customSpec.trim()) {
      const val = form.customSpec.trim();
      if (!form.specialization.includes(val)) {
        setForm({ ...form, specialization: [...form.specialization, val], customSpec: "" });
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("doctorToken");
      const { data } = await API.put("/doctors/profile", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(data.doctor);
      setIsEditing(false);
      showToast("Doctor profile updated successfully! ✅");
    } catch (err) {
      console.error("Save profile error:", err);
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 min-h-screen text-center space-y-3">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-teal-400 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-400">Loading Doctor Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Notification */}
      {toast.msg && (
        <div
          className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl text-xs font-extrabold shadow-2xl border flex items-center gap-2 animate-fadeIn ${
            toast.type === "error"
              ? "bg-rose-950 text-rose-200 border-rose-500"
              : "bg-teal-950 text-teal-200 border-teal-500"
          }`}
        >
          <i className={`fa-solid ${toast.type === "error" ? "fa-circle-xmark text-rose-400" : "fa-circle-check text-teal-400"}`}></i>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-teal-400 uppercase bg-teal-500/10 px-3.5 py-1 rounded-full border border-teal-500/20">
              Doctor Dashboard
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                profile?.isApproved
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
              }`}
            >
              {profile?.isApproved ? "✓ Verified & Approved" : "⚠️ Approval Pending"}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <i className="fa-solid fa-user-doctor text-teal-400"></i>
            <span>{profile?.name}</span>
          </h1>

          <p className="text-xs text-slate-400">
            {profile?.hospitalName} ({profile?.category}) • {profile?.degree} • {profile?.city}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-5 py-2.5 rounded-2xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-extrabold transition-all flex items-center gap-2"
          >
            <i className={`fa-solid ${isEditing ? "fa-xmark" : "fa-pen-to-square"}`}></i>
            <span>{isEditing ? "Cancel Editing" : "Edit Profile"}</span>
          </button>

          <button
            onClick={() => {
              logoutDoctor();
              navigate("/");
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Profile View / Edit Mode */}
      {isEditing ? (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-teal-500/40 space-y-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <i className="fa-solid fa-pen-to-square text-teal-400"></i>
            <span>Edit Doctor & Clinic Profile</span>
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital / Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={form.hospitalName}
                  onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
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
                  required
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Direct Call Phone Number *</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">WhatsApp Contact Number</label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">GST / License Registration No.</label>
                <input
                  type="text"
                  value={form.gstNumber}
                  onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white uppercase focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Address *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Latitude</label>
                <input
                  type="text"
                  value={form.lat}
                  onChange={(e) => handleInputChange("lat", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Longitude</label>
                <input
                  type="text"
                  value={form.lng}
                  onChange={(e) => handleInputChange("lng", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            {/* General Physician Checkbox */}
            <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex items-center gap-3">
              <input
                type="checkbox"
                id="editPhysician"
                checked={form.isGeneralPhysician}
                onChange={(e) => setForm({ ...form, isGeneralPhysician: e.target.checked })}
                className="w-5 h-5 accent-teal-400 rounded cursor-pointer"
              />
              <label htmlFor="editPhysician" className="text-xs font-bold text-teal-200 cursor-pointer">
                I am a General Physician (Can handle all normal patient health complaints)
              </label>
            </div>

            {/* Specialization selection */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">Specializations:</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SPECIALIZATIONS.map((spec) => {
                  const isSel = form.specialization.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpec(spec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSel
                          ? "bg-teal-500 text-slate-950 border-teal-400 font-extrabold"
                          : "bg-slate-900 text-slate-300 border-slate-800"
                      }`}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Custom specialization..."
                  value={form.customSpec}
                  onChange={(e) => setForm({ ...form, customSpec: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSpec}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-teal-300 text-xs font-bold border border-slate-700"
                >
                  + Add
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Education Details & Qualifications</label>
                <textarea
                  rows={3}
                  value={form.educationDetails}
                  onChange={(e) => setForm({ ...form, educationDetails: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Clinic Bio & Timings</label>
                <textarea
                  rows={3}
                  value={form.clinicDetails}
                  onChange={(e) => setForm({ ...form, clinicDetails: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20"
              >
                {saving ? "Saving Changes..." : "Save Profile Changes"}
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3.5 rounded-2xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="md:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{profile?.hospitalName}</h2>
                <div className="text-xs text-teal-400 font-semibold">{profile?.category}</div>
              </div>
              <span className="px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-teal-300 text-xs font-extrabold">
                {profile?.degree}
              </span>
            </div>

            {/* Specialization Badges */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specialization(s):</div>
              <div className="flex flex-wrap gap-2">
                {(profile?.specialization || []).map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-stethoscope"></i>
                    <span>{spec}</span>
                  </span>
                ))}
                {profile?.isGeneralPhysician && (
                  <span className="px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-extrabold">
                    ✓ General Physician (All Patients)
                  </span>
                )}
              </div>
            </div>

            {/* Clinic Bio & Overview */}
            {profile?.clinicDetails && (
              <div className="space-y-1 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinic & Timings:</div>
                <p className="text-xs text-slate-300 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 leading-relaxed whitespace-pre-line">
                  {profile.clinicDetails}
                </p>
              </div>
            )}

            {/* Education & Experience */}
            {profile?.educationDetails && (
              <div className="space-y-1 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Education & Qualifications:</div>
                <p className="text-xs text-slate-300 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 leading-relaxed whitespace-pre-line">
                  {profile.educationDetails}
                </p>
              </div>
            )}

            {/* Location & Address */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-location-dot text-teal-400"></i>
                <span>Address & Coordinates:</span>
              </div>
              <div className="text-xs text-slate-300">
                <strong>{profile?.city}</strong>: {profile?.address}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-4">
                <span>Lat: {profile?.lat}</span>
                <span>Lng: {profile?.lng}</span>
              </div>
            </div>
          </div>

          {/* Quick Contact Actions Sidebar */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                Patient Communication Options
              </h3>

              <div className="space-y-3 text-xs">
                {/* Direct Call Button */}
                <a
                  href={`tel:${profile?.phone}`}
                  className="w-full py-3.5 px-4 rounded-2xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-extrabold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-phone text-teal-400"></i>
                    <span>Call Number:</span>
                  </span>
                  <span>{profile?.phone}</span>
                </a>

                {/* WhatsApp Button */}
                <a
                  href={`https://wa.me/${(profile?.whatsapp || profile?.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hello Dr. ${profile?.name}, I found your clinic on MediFind.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-extrabold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <i className="fa-brands fa-whatsapp text-emerald-400"></i>
                    <span>WhatsApp Chat:</span>
                  </span>
                  <span>{profile?.whatsapp || profile?.phone}</span>
                </a>
              </div>
            </div>

            {/* Registration Details */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 text-xs text-slate-400 shadow-xl">
              <div className="font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                Account Meta
              </div>
              <div>Email: <strong className="text-slate-300">{profile?.email}</strong></div>
              <div>GSTIN / Reg No: <strong className="text-slate-300">{profile?.gstNumber || "N/A"}</strong></div>
              <div>Registered: <span className="text-slate-300">{new Date(profile?.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
