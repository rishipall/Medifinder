import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { vendor, logout, admin } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group text-decoration-none">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
            <div className="w-full h-full bg-[#050811] rounded-[14px] flex items-center justify-center relative overflow-hidden">
              <i className="fa-solid fa-heart-pulse text-teal-400 text-xl animate-beat"></i>
              <span className="absolute inset-0 bg-teal-400/10 animate-ping rounded-full pointer-events-none"></span>
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
              Medi<span className="text-teal-400 font-light">Find</span>
            </span>
            <span className="text-[10px] tracking-widest text-teal-400 font-semibold uppercase block -mt-1">
              AI Medicine & Store Finder
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-full border border-slate-800">
          <Link
            to="/"
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              isActive("/")
                ? "text-teal-400 bg-slate-800 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <i className="fa-solid fa-house text-xs"></i>
            <span>Home</span>
          </Link>

          <Link
            to="/consult"
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              isActive("/consult")
                ? "text-teal-400 bg-slate-800 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <i className="fa-solid fa-user-doctor text-xs text-teal-400"></i>
            <span>AI Consult</span>
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          </Link>

          <Link
            to="/search"
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              isActive("/search")
                ? "text-teal-400 bg-slate-800 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <i className="fa-solid fa-magnifying-glass text-xs"></i>
            <span>Search Medicine</span>
          </Link>

          <Link
            to="/about"
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              isActive("/about")
                ? "text-teal-400 bg-slate-800 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <i className="fa-solid fa-circle-info text-xs"></i>
            <span>About Us</span>
          </Link>
        </nav>

        {/* Right Auth / Dashboard Controls */}
        <div className="flex items-center gap-3">
          {admin && (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/dashboard"
                className="px-3.5 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
              >
                <i className="fa-solid fa-shield-halved text-purple-400"></i>
                <span>Super Admin</span>
              </Link>
            </div>
          )}

          {vendor ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
                <i className="fa-solid fa-store text-teal-400"></i>
                <span className="font-semibold text-white">{vendor.storeName}</span>
              </span>

              <Link
                to="/vendor/dashboard"
                className="px-4 py-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold hover:bg-teal-500/30 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-chart-line"></i>
                <span>Dashboard</span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/50 text-xs font-semibold hover:bg-rose-900/60 transition-all"
                title="Logout"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/vendor/login"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition-all"
              >
                Vendor Login
              </Link>

              <Link
                to="/vendor/register"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20 transition-all"
              >
                Register Store
              </Link>
            </div>
          )}
        </div>



      </div>
    </header>
  );
};

export default Navbar;
