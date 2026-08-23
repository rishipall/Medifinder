import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const VendorLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await API.post("/auth/login", form);
      if (data.role === "superadmin") {
        loginAdmin(data.admin, data.token);
        navigate("/admin/dashboard");
      } else {
        login(data.vendor, data.token);
        navigate("/vendor/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="pt-24 min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-700/80 p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 text-2xl font-bold">
            <i className="fa-solid fa-store"></i>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Pharmacy Vendor Portal</h2>
          <p className="text-xs text-slate-400">Welcome back! Sign in to manage store inventory.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-rose-400"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="email"
                name="email"
                placeholder="store@pharmacy.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
          >
            {loading ? "Signing in..." : "Sign In to Store Portal →"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2">
          New pharmacy store owner?{" "}
          <Link to="/vendor/register" className="text-teal-400 font-bold hover:underline">
            Register your store
          </Link>
        </p>

      </div>
    </div>
  );
};

export default VendorLogin;
