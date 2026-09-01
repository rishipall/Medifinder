import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const DoctorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState("");

  const { loginDoctor } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPendingApprovalMsg("");
    setLoading(true);

    try {
      const res = await API.post("/doctors/login", { email, password });
      const { doctor, token } = res.data;

      loginDoctor(doctor, token);
      navigate("/doctor/dashboard");
    } catch (err) {
      console.error("Doctor Login Error:", err);
      if (err.response?.status === 403 && err.response?.data?.isPendingApproval) {
        setPendingApprovalMsg(
          err.response.data.message ||
            "Your Doctor / Hospital account is currently pending Super Admin approval. ⏳"
        );
      } else {
        setError(err.response?.data?.message || "Invalid doctor email or password. ❌");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 min-h-screen pb-20 max-w-md mx-auto px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto text-3xl border border-teal-500/40">
          <i className="fa-solid fa-user-doctor"></i>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Doctor Portal Login</h1>
        <p className="text-xs text-slate-400">
          Sign in to manage your clinic details, specializations, degrees & contact numbers.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-rose-400 text-base"></i>
            <span>{error}</span>
          </div>
        )}

        {pendingApprovalMsg && (
          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs font-semibold space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <i className="fa-solid fa-hourglass-half text-amber-400"></i>
              <span>Approval Pending</span>
            </div>
            <p>{pendingApprovalMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="doctor@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner animate-spin"></i>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket text-base"></i>
                <span>Sign In to Doctor Portal</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4 text-center text-xs text-slate-400 space-y-2">
          <p>Don't have a doctor / hospital account yet?</p>
          <Link
            to="/doctor/register"
            className="inline-block px-4 py-2 rounded-xl bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30 font-bold transition-all"
          >
            Register Doctor / Hospital Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
