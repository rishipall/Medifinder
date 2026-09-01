import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { vendor, logout, admin, doctor, logoutDoctor } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Auto-close dropdowns when navigating or clicking outside
  useEffect(() => {
    setMobileMenuOpen(false);
    setProviderDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProviderDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group text-decoration-none">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
            <div className="w-full h-full bg-[#050811] rounded-[10px] flex items-center justify-center relative overflow-hidden">
              <i className="fa-solid fa-heart-pulse text-teal-400 text-sm sm:text-base animate-beat"></i>
              <span className="absolute inset-0 bg-teal-400/10 animate-ping rounded-full pointer-events-none"></span>
            </div>
          </div>
          <div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
              Medi<span className="text-teal-400 font-light">Find</span>
            </span>
            <span className="text-[9px] tracking-widest text-teal-400 font-semibold uppercase block -mt-1">
              AI Medicine & Store Finder
            </span>
          </div>
        </Link>

        {/* Desktop Primary Navigation Links (Patient Centric) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-full border border-slate-800">
          <Link
            to="/"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive("/about")
                ? "text-teal-400 bg-slate-800 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <i className="fa-solid fa-circle-info text-xs"></i>
            <span>About Us</span>
          </Link>
        </nav>

        {/* Desktop Right Auth / Provider Controls */}
        <div className="hidden md:flex items-center gap-3">
          {admin && (
            <Link
              to="/admin/dashboard"
              className="px-3.5 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
            >
              <i className="fa-solid fa-shield-halved text-purple-400"></i>
              <span>Super Admin</span>
            </Link>
          )}

          {/* Active Doctor Session */}
          {doctor ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
                <i className="fa-solid fa-user-doctor text-teal-400"></i>
                <span className="font-semibold text-white">{doctor.name}</span>
              </span>

              <Link
                to="/doctor/dashboard"
                className="px-3.5 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold hover:bg-teal-500/30 transition-all flex items-center gap-1.5"
              >
                <i className="fa-solid fa-gauge-high"></i>
                <span>Doctor Portal</span>
              </Link>

              <button
                onClick={() => {
                  logoutDoctor();
                  navigate("/");
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/50 text-xs font-semibold hover:bg-rose-900/60 transition-all"
                title="Logout Doctor"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : vendor ? (
            /* Active Vendor Session */
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
                <i className="fa-solid fa-store text-teal-400"></i>
                <span className="font-semibold text-white">{vendor.storeName}</span>
              </span>

              <Link
                to="/vendor/dashboard"
                className="px-3.5 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold hover:bg-teal-500/30 transition-all flex items-center gap-1.5"
              >
                <i className="fa-solid fa-chart-line"></i>
                <span>Dashboard</span>
              </Link>

              <Link
                to="/vendor/profile"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <i className="fa-solid fa-id-card text-teal-400"></i>
                <span>Profile</span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/50 text-xs font-semibold hover:bg-rose-900/60 transition-all"
                title="Logout"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            /* Sleek "For Providers ▾" Dropdown Menu for Unauthenticated Visitors */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 text-xs font-bold border border-slate-700/80 hover:border-teal-500/40 transition-all flex items-center gap-2 shadow-md shadow-slate-950/40"
              >
                <i className="fa-solid fa-user-gear text-teal-400"></i>
                <span>For Providers</span>
                <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${providerDropdownOpen ? "rotate-180" : ""}`}></i>
              </button>

              {/* Provider Dropdown Panel */}
              {providerDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 glass-panel bg-[#050811]/95 border border-slate-700/90 rounded-2xl p-3 shadow-2xl space-y-2 animate-fadeIn z-50">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 pt-1">
                    Healthcare Provider Portals
                  </div>

                  {/* Doctor Portal Options */}
                  <div className="space-y-1 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5 px-1">
                      <i className="fa-solid fa-stethoscope"></i>
                      <span>Doctors & Hospitals</span>
                    </div>

                    <Link
                      to="/doctor/login"
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <span>Doctor Login</span>
                      <i className="fa-solid fa-arrow-right text-[10px] text-teal-400"></i>
                    </Link>

                    <Link
                      to="/doctor/register"
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <span>Register Clinic / Hospital</span>
                      <i className="fa-solid fa-plus text-[10px] text-teal-400"></i>
                    </Link>
                  </div>

                  {/* Pharmacy Vendor Options */}
                  <div className="space-y-1 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 px-1">
                      <i className="fa-solid fa-store"></i>
                      <span>Pharmacy Store Owners</span>
                    </div>

                    <Link
                      to="/vendor/login"
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <span>Vendor Login</span>
                      <i className="fa-solid fa-arrow-right text-[10px] text-cyan-400"></i>
                    </Link>

                    <Link
                      to="/vendor/register"
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <span>Register Pharmacy Store</span>
                      <i className="fa-solid fa-plus text-[10px] text-cyan-400"></i>
                    </Link>
                  </div>

                  {/* Super Admin Login */}
                  <div className="pt-1">
                    <Link
                      to="/admin/login"
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 text-xs font-semibold transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <i className="fa-solid fa-shield-halved text-purple-400"></i>
                        <span>Super Admin Login</span>
                      </span>
                      <i className="fa-solid fa-lock text-[10px]"></i>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/consult"
            className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5"
          >
            <i className="fa-solid fa-user-doctor text-xs"></i>
            <span>AI Consult</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 hover:text-white hover:bg-slate-800 transition-all focus:outline-none"
            aria-label="Toggle Mobile Menu"
          >
            <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark text-lg" : "fa-bars text-lg"}`}></i>
          </button>
        </div>

      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-slate-800/80 bg-[#050811]/95 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-2xl animate-fadeIn">
          <div className="space-y-1">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive("/")
                  ? "text-teal-400 bg-teal-500/10 border border-teal-500/30"
                  : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              <i className="fa-solid fa-house text-teal-400 w-5"></i>
              <span>Home</span>
            </Link>

            <Link
              to="/consult"
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive("/consult")
                  ? "text-teal-400 bg-teal-500/10 border border-teal-500/30"
                  : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-user-doctor text-teal-400 w-5"></i>
                <span>AI Consult</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                AI Powered
              </span>
            </Link>

            <Link
              to="/search"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive("/search")
                  ? "text-teal-400 bg-teal-500/10 border border-teal-500/30"
                  : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              <i className="fa-solid fa-magnifying-glass text-teal-400 w-5"></i>
              <span>Search Medicine</span>
            </Link>

            <Link
              to="/about"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive("/about")
                  ? "text-teal-400 bg-teal-500/10 border border-teal-500/30"
                  : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              <i className="fa-solid fa-circle-info text-teal-400 w-5"></i>
              <span>About Us</span>
            </Link>
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-2">
            {admin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold"
              >
                <i className="fa-solid fa-shield-halved text-purple-400 w-5"></i>
                <span>Super Admin Dashboard</span>
              </Link>
            )}

            {doctor ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800">
                  <i className="fa-solid fa-user-doctor text-teal-400 w-5"></i>
                  <span className="font-semibold text-white">{doctor.name} ({doctor.hospitalName})</span>
                </div>

                <Link
                  to="/doctor/dashboard"
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold"
                >
                  <i className="fa-solid fa-gauge-high w-5"></i>
                  <span>Doctor Dashboard</span>
                </Link>

                <button
                  onClick={() => {
                    logoutDoctor();
                    navigate("/");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/50 text-xs font-semibold"
                >
                  <i className="fa-solid fa-right-from-bracket w-5"></i>
                  <span>Doctor Logout</span>
                </button>
              </div>
            ) : vendor ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800">
                  <i className="fa-solid fa-store text-teal-400 w-5"></i>
                  <span className="font-semibold text-white">{vendor.storeName}</span>
                </div>

                <Link
                  to="/vendor/dashboard"
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold"
                >
                  <i className="fa-solid fa-chart-line w-5"></i>
                  <span>Vendor Dashboard</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/50 text-xs font-semibold"
                >
                  <i className="fa-solid fa-right-from-bracket w-5"></i>
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Healthcare Providers:</div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/doctor/login"
                    className="text-center py-2.5 rounded-xl bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30"
                  >
                    Doctor Login
                  </Link>

                  <Link
                    to="/doctor/register"
                    className="text-center py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    Register Clinic
                  </Link>

                  <Link
                    to="/vendor/login"
                    className="text-center py-2.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold border border-slate-800"
                  >
                    Vendor Login
                  </Link>

                  <Link
                    to="/vendor/register"
                    className="text-center py-2.5 rounded-xl bg-slate-800 text-teal-400 font-bold text-xs border border-slate-700"
                  >
                    Register Store
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
