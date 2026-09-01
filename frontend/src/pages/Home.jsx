import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MedicineSearchInput from "../components/MedicineSearchInput";

const Home = () => {
  const [locStatus, setLocStatus] = useState("");
  const [coords, setCoords] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const navigate = useNavigate();

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("Not supported by your browser");
      return;
    }
    setLocLoading(true);
    setLocStatus("Detecting location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocStatus("Location detected");
        setLocLoading(false);
      },
      () => {
        setLocStatus("Permission denied");
        setLocLoading(false);
      }
    );
  };

  const handleMedicineSearch = (tags) => {
    if (!tags || tags.length === 0) return;
    const namesParam = encodeURIComponent(tags.join(","));
    let url = `/search?names=${namesParam}`;
    if (coords) {
      url += `&lat=${coords.lat}&lng=${coords.lng}`;
    }
    navigate(url);
  };

  return (
    <div className="pt-24 min-h-screen pb-20 space-y-20 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text & Search Box */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Live AI Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
              <span>NEXT-GEN AI PRESCRIPTION & MULTI-MEDICINE FINDER</span>
              <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Live Stock</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Find Medicines <br />
              <span className="text-gradient">Near Your Location</span> In Real-Time
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-light">
              Upload doctor's prescription or medicine wrapper image using Gemini AI, or type multiple medicine names at once to locate matching pharmacies with live stock!
            </p>

            {/* Main Interactive Glass Search Area */}
            <div className="space-y-4">
              
              {/* Geolocation Detector Pill Bar */}
              <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                coords 
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200" 
                  : "bg-slate-900/80 border-slate-800 text-slate-300"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                    coords ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                  }`}>
                    <i className={`fa-solid ${coords ? "fa-location-dot text-emerald-400" : "fa-crosshairs"}`}></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {coords ? "Location Detected & Verified" : "Your Current Location"}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {coords 
                        ? `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}° (Sorting nearby stores)` 
                        : locStatus || "Enable GPS to sort stores by exact distance"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={!!coords || locLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    coords
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                      : "bg-teal-500 text-slate-950 hover:bg-teal-400 active:scale-95 shadow-md shadow-teal-500/20"
                  }`}
                >
                  {locLoading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Detecting...</span>
                    </>
                  ) : coords ? (
                    <>
                      <i className="fa-solid fa-check"></i>
                      <span>GPS Active</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-location-crosshairs"></i>
                      <span>Detect GPS</span>
                    </>
                  )}
                </button>
              </div>

              {/* Gemini AI Multi-Medicine Tag & Prescription Camera Search Component */}
              <MedicineSearchInput
                onSearch={handleMedicineSearch}
                placeholder="Type medicines or scan prescription photo..."
              />
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/consult"
                className="px-5 py-3 rounded-2xl glass-panel hover:bg-slate-800/80 text-white font-semibold text-xs border border-slate-700/80 hover:border-teal-500/40 transition-all flex items-center gap-2.5"
              >
                <i className="fa-solid fa-user-doctor text-teal-400"></i>
                <span>Try AI Symptom Consultation &rarr;</span>
              </Link>
              <Link
                to="/vendor/register"
                className="px-5 py-3 rounded-2xl glass-panel hover:bg-slate-800/80 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700/80 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-store text-cyan-400"></i>
                <span>Register Pharmacy Store</span>
              </Link>
            </div>

            {/* Live Stats Row */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  <span className="text-teal-400">100%</span>
                </div>
                <div className="text-xs text-slate-400">Verified Inventories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  <span>24/7</span>
                  <i className="fa-solid fa-bolt text-xs text-cyan-400"></i>
                </div>
                <div className="text-xs text-slate-400">Real-Time Search</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  <span className="text-emerald-400">GPS</span>
                </div>
                <div className="text-xs text-slate-400">Distance Sorting</div>
              </div>
            </div>

          </div>

          {/* Right Hologram ECG Visual Card (From Demo Preview) */}
          <div className="lg:col-span-5 relative">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl relative z-10 shadow-2xl border border-slate-700/60 overflow-hidden space-y-6">
              
              {/* ECG Waveform Pulse Header */}
              <div className="h-14 w-full relative overflow-hidden bg-slate-900/90 rounded-2xl p-2 border border-slate-800">
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <path
                    className="ecg-path"
                    d="M0,50 L100,50 L120,20 L140,80 L160,10 L180,90 L200,50 L300,50 L320,30 L340,70 L360,50 L500,50"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="4"
                  />
                </svg>
                <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">SYSTEM ACTIVE: LIVE SYNC</span>
                </div>
              </div>

              {/* Doctor / Pharmacist Profile Widget */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-navy-900 to-slate-800 border border-slate-700/60 p-4 flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-teal-900/40 border-2 border-teal-400/50 flex-shrink-0 flex items-center justify-center">
                  <i className="fa-solid fa-user-doctor text-2xl text-teal-300"></i>
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse"></div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold">
                      AI Triage Ready
                    </span>
                    <span className="text-xs text-amber-400 font-bold">
                      <i className="fa-solid fa-star mr-1"></i>4.9
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-sm mt-0.5">MediFind Smart Assistant</h4>
                  <p className="text-xs text-slate-400">Clinical Triage & OTC Finder</p>
                </div>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-lg animate-float">
                    <i className="fa-solid fa-capsules"></i>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Stock Lookup</div>
                    <div className="text-[10px] text-slate-400">Instant Check</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg animate-float-delayed">
                    <i className="fa-solid fa-map-location-dot"></i>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">GPS Map</div>
                    <div className="text-[10px] text-slate-400">Nearest Store</div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Note */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved text-teal-400"></i>
                  <span>Verified Medical Vendors</span>
                </span>
                <Link to="/consult" className="text-teal-400 font-bold hover:underline">
                  Launch Triage &rarr;
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* FEATURED SERVICES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold tracking-wider text-teal-400 uppercase bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
            Platform Capabilities
          </span>
          <h2 className="text-3xl font-extrabold text-white">Designed for Patients & Pharmacies</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-2xl">
              <i className="fa-solid fa-magnifying-glass-location"></i>
            </div>
            <h3 className="text-xl font-bold text-white">Medicine Search</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Search medicines by brand name or generic formula and immediately locate stores that have them in stock.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <h3 className="text-xl font-bold text-white">AI Symptom Consult</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Input your symptoms to receive instant health triage and direct recommendations for OTC remedies.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
              <i className="fa-solid fa-store"></i>
            </div>
            <h3 className="text-xl font-bold text-white">Vendor Portal</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Pharmacy store owners can register, list their inventory, update prices, and toggle in-stock availability in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* HEALTHCARE PROVIDERS & PARTNERS ONBOARDING BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-teal-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0a1120] relative overflow-hidden shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 text-xs font-bold border border-teal-500/30 uppercase tracking-wider">
                <i className="fa-solid fa-user-doctor text-teal-400"></i>
                <span>For Healthcare Providers</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Are you a Doctor, Clinic, or Pharmacy Store Owner?
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-light">
                Partner with MediFind to receive direct patient phone calls, WhatsApp consultations, and list your live medicine inventory for nearby patients.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1: For Doctors & Hospitals */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-teal-500/30 space-y-4 hover:border-teal-500/60 transition-all shadow-lg group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-stethoscope"></i>
                </div>
                <span className="text-[11px] font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/30">
                  Doctor / Hospital
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Doctors & Medical Specialists</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  List your clinic specialization (Heart, Brain, Eye, Ear, General Physician) and receive patient inquiries via call, WhatsApp, or AI triage recommendations.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/doctor/register"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs text-center hover:brightness-110 shadow-md shadow-teal-500/20 transition-all"
                >
                  Register Doctor / Clinic
                </Link>

                <Link
                  to="/doctor/login"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all"
                >
                  Doctor Login
                </Link>
              </div>
            </div>

            {/* Card 2: For Pharmacy Store Owners */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4 hover:border-cyan-500/60 transition-all shadow-lg group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-house-medical"></i>
                </div>
                <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                  Pharmacy Store
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Pharmacy & Medical Stores</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Register your medical store, list stock quantity for 1,000+ medicines, and get ranked by GPS proximity when patients search for urgent medicines.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/vendor/register"
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-extrabold text-xs text-center border border-cyan-500/40 transition-all"
                >
                  Register Pharmacy Store
                </Link>

                <Link
                  to="/vendor/login"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all"
                >
                  Vendor Login
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
