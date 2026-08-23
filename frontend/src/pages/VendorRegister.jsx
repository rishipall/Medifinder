import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const VendorRegister = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    phone: "",
    address: "",
    city: "",
    lat: "",
    lng: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await API.post("/auth/register", form);
      setIsSubmittedSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };


  const fields = [
    { name: "name", label: "Owner Full Name", placeholder: "John Doe", icon: "fa-user" },
    { name: "email", label: "Email Address", placeholder: "store@pharmacy.com", type: "email", icon: "fa-envelope" },
    { name: "password", label: "Password", placeholder: "Min 6 characters", type: "password", icon: "fa-lock" },
    { name: "storeName", label: "Pharmacy / Store Name", placeholder: "Apollo Pharmacy", icon: "fa-house-medical" },
    { name: "phone", label: "Contact Phone Number", placeholder: "+91 9876543210", icon: "fa-phone" },
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
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40">
              Registration Submitted ⏳
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-2">Pending Super Admin Approval</h2>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Thank you for registering <strong className="text-amber-300 font-bold">{form.storeName}</strong>! Your application has been sent to Super Admin for verification.
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
    <div className="pt-24 min-h-screen flex items-center justify-center p-4 pb-20">

      <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-700/80 p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 text-2xl font-bold">
            <i className="fa-solid fa-hospital-user"></i>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Register Pharmacy Store</h2>
          <p className="text-xs text-slate-400">List your medicine inventory and connect with nearby patients.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{f.label}</label>
                <div className="relative">
                  <i className={`fa-solid ${f.icon} absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs`}></i>
                  <input
                    type={f.type || "text"}
                    name={f.name}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Coordinates */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              GPS Location Coordinates <span className="text-slate-500 font-normal">(Optional for map pin)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                name="lat"
                placeholder="Latitude (e.g. 25.3176)"
                value={form.lat}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
              <input
                type="number"
                step="any"
                name="lng"
                placeholder="Longitude (e.g. 82.9739)"
                value={form.lng}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Find your coordinates on{" "}
              <a href="https://www.latlong.net" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
                latlong.net
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
          >
            {loading ? "Registering Store..." : "Create Store Account →"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2">
          Already registered?{" "}
          <Link to="/vendor/login" className="text-teal-400 font-bold hover:underline">
            Login here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default VendorRegister;
