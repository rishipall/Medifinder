import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const VendorProfile = () => {
  const { vendor, setVendor } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    storeName: "",
    phone: "",
    gstNumber: "",
    address: "",
    city: "",
    lat: "",
    lng: "",
    password: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch Vendor Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/vendors/profile");
        const profileData = data.vendor || data;

        setForm({
          name: profileData.name || "",
          email: profileData.email || "",
          storeName: profileData.storeName || "",
          phone: profileData.phone || "",
          gstNumber: profileData.gstNumber || "",
          address: profileData.address || "",
          city: profileData.city || "",
          lat: profileData.lat !== undefined ? profileData.lat : "",
          lng: profileData.lng !== undefined ? profileData.lng : "",
          password: "",
        });
      } catch (err) {
        console.error("Error fetching vendor profile:", err);
        setError("Failed to load store profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (["phone", "gstNumber", "lat", "lng", "password"].includes(name) && /\s/.test(val)) {
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
        setError("Please input numbers only for phone number. ❌");
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

  // 📍 GPS Location Auto-Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError("");
    setSuccessMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        setSuccessMsg("📍 GPS Coordinates detected successfully!");
      },
      (err) => {
        setError(`Could not detect GPS location (${err.message}). Please enter manually.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Profile Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        name: form.name,
        storeName: form.storeName,
        phone: form.phone,
        gstNumber: form.gstNumber,
        address: form.address,
        city: form.city,
        lat: form.lat,
        lng: form.lng,
      };

      if (form.password && form.password.trim().length >= 6) {
        payload.password = form.password.trim();
      }

      const { data } = await API.put("/vendors/profile", payload);
      const updatedVendor = data.vendor || data;

      // Sync Auth Context
      if (setVendor && updatedVendor) {
        setVendor((prev) => ({ ...prev, ...updatedVendor }));
      }

      setSuccessMsg("Store profile updated successfully! ✅");
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      console.error("Error updating vendor profile:", err);
      setError(err.response?.data?.message || "Failed to update store profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-28 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-300">Loading store profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Page Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <i className="fa-solid fa-store text-teal-400 text-2xl"></i>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white">{form.storeName || "My Pharmacy"}</h1>
                <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <i className="fa-solid fa-circle-check text-xs"></i> Verified Store
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Owner: <strong className="text-slate-200">{form.name}</strong></span>
                <span>•</span>
                <span>{form.city}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to={`/store/${vendor?.id || vendor?._id}`}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <i className="fa-solid fa-eye text-teal-400"></i>
              <span>Public Store View</span>
            </Link>

            <Link
              to="/vendor/dashboard"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <i className="fa-solid fa-chart-line"></i>
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Edit Profile Form */}
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-id-card text-teal-400"></i>
                <span>Store Profile Settings</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Update your pharmacy details, contact information, and GPS map pin.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            
            {/* Owner Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Full Name</label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pharmacy / Store Name</label>
              <div className="relative">
                <i className="fa-solid fa-house-medical absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  name="storeName"
                  value={form.storeName}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Email Address (Verified - Read only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address <span className="text-emerald-400 font-normal">(Verified)</span>
              </label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  disabled
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-400 cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone Number</label>
              <div className="relative">
                <i className="fa-solid fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Store Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Store Address</label>
              <div className="relative">
                <i className="fa-solid fa-map-pin absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <div className="relative">
                <i className="fa-solid fa-city absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

          </div>

          {/* GPS Coordinates Section */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-teal-400"></i>
                  <span>GPS Map Coordinates (Latitude & Longitude)</span>
                </label>
                <p className="text-[11px] text-slate-400">Used for customer proximity sorting and distance calculation.</p>
              </div>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="text-xs text-teal-400 font-bold hover:underline flex items-center gap-1.5 bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/30 active:scale-95 transition-all"
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

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Latitude</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="lat"
                  placeholder="e.g. 25.3176"
                  value={form.lat}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Longitude</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="lng"
                  placeholder="e.g. 82.9739"
                  value={form.lng}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Change Password (Optional) */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <i className="fa-solid fa-lock text-slate-400"></i>
              <span>Change Password <span className="text-slate-500 font-normal">(Optional)</span></span>
            </h3>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Leave blank to keep existing password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none max-w-md"
              />
              <p className="text-[11px] text-slate-500 mt-1">Minimum 6 characters if updating password.</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default VendorProfile;
