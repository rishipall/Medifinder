import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  
  const [form, setForm] = useState({
    email: "admin@medifind.com",
    password: "admin123",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await API.post("/admin/login", form);
      loginAdmin(data.admin, data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Super Admin credentials. Try admin@medifind.com / admin123");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 min-h-screen flex items-center justify-center pb-20 px-4">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-700/80 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Platform Master Console
          </span>
          <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2 mt-2">
            <i className="fa-solid fa-shield-halved text-purple-400"></i>
            <span>Super Admin Portal</span>
          </h1>
          <p className="text-xs text-slate-400">Manage all registered medical stores, shop approvals, and store accounts.</p>
        </div>

        {/* Demo Hint Banner */}
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2">
          <i className="fa-solid fa-key text-purple-400"></i>
          <div>
            <div>Default Demo Super Admin Credentials:</div>
            <div className="font-mono font-bold text-white">admin@medifind.com / admin123</div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Super Admin Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-purple-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-purple-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm hover:brightness-110 shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket"></i>
                <span>Login to Super Admin Portal</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default SuperAdminLogin;
