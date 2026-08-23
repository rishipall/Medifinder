import { useState } from "react";
import { Link } from "react-router-dom";

const About = () => {
  // 📸 Developer Profile Image Slots (Replace these image URLs with your own photo links!)
  const [profileImages] = useState([
    "https://ik.imagekit.io/rishipall/Medifind/3.jpeg", // Option 1 / Primary
    "https://ik.imagekit.io/rishipall/4.jpeg", // Option 2
    "https://ik.imagekit.io/rishipall/2.jpeg?updatedAt=1787307569855", // Option 3
  ]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 🔗 Social Media Links (Replace these href URLs with your personal profiles!)
  const socialLinks = [
    { name: "LinkedIn", icon: "fa-linkedin", color: "hover:text-blue-400 hover:border-blue-500/50", url: "https://www.linkedin.com/in/rishi-pal-82663a221?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
    { name: "GitHub", icon: "fa-github", color: "hover:text-purple-400 hover:border-purple-500/50", url: "https://github.com/rishipall" },
    { name: "Instagram", icon: "fa-instagram", color: "hover:text-pink-400 hover:border-pink-500/50", url: "https://www.instagram.com/vvip_rishi?igsi=MWd4cDlrN3IxNjJvdg==" },
    { name: "Twitter / X", icon: "fa-x-twitter", color: "hover:text-cyan-400 hover:border-cyan-500/50", url: "https://twitter.com/vvip_rishi" },
    { name: "Facebook", icon: "fa-facebook", color: "hover:text-blue-500 hover:border-blue-600/50", url: "https://www.facebook.com/people/%E0%A4%8B%E0%A4%B7%E0%A4%BF-%E0%A4%AA%E0%A4%BE%E0%A4%B2/pfbid0YSYHTPpibTg9vu3kcSANVb7KXN5yNvg2zV8AvcyK7999X4WpABKjg6XHF45F74fSl/?mibextid=rS40aB7S9Ucbxw6v" },
  ];

  return (
    <div className="pt-24 min-h-screen pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      
      {/* PAGE HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold tracking-wider text-teal-400 uppercase bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
          <i className="fa-solid fa-circle-info mr-1.5"></i>
          Platform & Founder Profile
        </span>
        <h1 className="text-4xl font-extrabold text-white">About MediFind</h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          Learn about our mission to revolutionize medicine search, solve critical healthcare accessibility challenges, and meet the developer behind MediFind.
        </p>
      </div>

      {/* SECTION 1: FOUNDER / DEVELOPER PROFILE ("ABOUT ME") */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-700/80 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          
          {/* Developer Photo Container with Photo Selector Input */}
          <div className="space-y-4 text-center flex-shrink-0">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded-3xl overflow-hidden border-4 border-teal-500/40 shadow-2xl group bg-slate-900">
              <img
                src={profileImages[activeImageIndex]}
                alt="Developer Avatar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">Developer Avatar</span>
              </div>
            </div>

            {/* Photo Selector Controls (Change active photo preview) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 block">Switch Photo Preview:</span>
              <div className="flex justify-center gap-2">
                {profileImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all border ${
                      activeImageIndex === idx
                        ? "bg-teal-500 text-slate-950 border-teal-400"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            
            </div>
          </div>

          {/* Developer Info & Bio */}
          <div className="space-y-4 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Full-Stack Developer & Founder
            </div>

            <h2 className="text-3xl font-extrabold text-white">
              Hi, I'm the Developer of <span className="text-gradient">MediFind</span>
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed font-light">
              I built MediFind to eliminate the anxiety and delays patients face when searching for urgent medicines. By combining real-time pharmacy inventory tracking, GPS distance sorting, and Google Gemini AI health triage, MediFind connects users directly with nearby available medical stores in seconds.
            </p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
              <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-teal-300">
                React.js & Vite
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-cyan-300">
                Node.js & Express
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-300">
                MongoDB Mongoose
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-purple-300">
                Google Gemini AI
              </span>
            </div>

            {/* Social Media Links Bar */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Connect With Me On Social Media:
              </span>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center gap-2 ${social.color}`}
                  >
                    <i className={`fa-brands ${social.icon} text-sm`}></i>
                    <span>{social.name}</span>
                  </a>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* SECTION 2: WHAT MEDIFIND DOES & PROBLEMS IT SOLVES */}
      <div className="space-y-8">
        
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold tracking-wider text-teal-400 uppercase bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
            Purpose & Impact
          </span>
          <h2 className="text-3xl font-extrabold text-white">How MediFind Helps You</h2>
          <p className="text-slate-400 text-sm">Solving real-world healthcare accessibility and prescription discovery challenges.</p>
        </div>

        {/* 4 Core Platform Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-card p-6 rounded-3xl space-y-3 border border-slate-800 hover:border-teal-500/40">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-magnifying-glass-location"></i>
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time Search</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Search any prescription or OTC medicine and instantly view which nearby stores have it in stock.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-3 border border-slate-800 hover:border-cyan-500/40">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-location-crosshairs"></i>
            </div>
            <h3 className="text-lg font-bold text-white">GPS Distance Sorting</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automatically calculates exact distance (km) from your current GPS location to nearest stores.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-3 border border-slate-800 hover:border-emerald-500/40">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-user-doctor"></i>
            </div>
            <h3 className="text-lg font-bold text-white">AI Health Triage</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Select symptoms to receive instant AI health guidance and recommended OTC remedy search links.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-3 border border-slate-800 hover:border-purple-500/40">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-store"></i>
            </div>
            <h3 className="text-lg font-bold text-white">Pharmacy Dashboard</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Enables local pharmacy owners to easily list medicines, update prices, and manage stock status.
            </p>
          </div>

        </div>

        {/* Problems Solved (Before vs After MediFind) */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/80 space-y-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
            <i className="fa-solid fa-shield-virus text-teal-400"></i>
            <span>Key Problems Solved By MediFind</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Problem 1 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase">
                <i className="fa-solid fa-circle-xmark"></i>
                <span>The Problem: Physical Store Hopping</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Patients often travel store-to-store in hot weather or during medical emergencies only to find the medicine is out of stock.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <i className="fa-solid fa-circle-check"></i>
                <span>MediFind Solution: Check stock online in 3 seconds before stepping out!</span>
              </div>
            </div>

            {/* Problem 2 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase">
                <i className="fa-solid fa-circle-xmark"></i>
                <span>The Problem: Late Night Emergencies</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Finding open medical stores and phone contact numbers late at night is difficult during sudden fever or illness.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <i className="fa-solid fa-circle-check"></i>
                <span>MediFind Solution: One-click store phone calls & interactive map navigation.</span>
              </div>
            </div>

            {/* Problem 3 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase">
                <i className="fa-solid fa-circle-xmark"></i>
                <span>The Problem: Symptom Uncertainty</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Users experiencing mild symptoms don't know which general over-the-counter ingredients to look for.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <i className="fa-solid fa-circle-check"></i>
                <span>MediFind Solution: AI Symptom Consult suggests OTC ingredients & direct store links.</span>
              </div>
            </div>

            {/* Problem 4 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase">
                <i className="fa-solid fa-circle-xmark"></i>
                <span>The Problem: Local Pharmacy Visibility</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Independent medical stores struggle to inform nearby neighborhood residents about available medicine stock.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <i className="fa-solid fa-circle-check"></i>
                <span>MediFind Solution: Free digital storefront & real-time inventory management.</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* CTA FOOTER CARD */}
      <div className="glass-panel p-8 rounded-3xl border border-teal-500/40 text-center space-y-4 shadow-2xl">
        <h3 className="text-2xl font-extrabold text-white">Ready to Find Medicine Near You?</h3>
        <p className="text-slate-300 text-xs max-w-md mx-auto">
          Search your required medicine now or use our AI consultation to get instant triage guidance.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            to="/search"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all"
          >
            Search Medicines &rarr;
          </Link>
          <Link
            to="/consult"
            className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
          >
            Try AI Consult 🩺
          </Link>
        </div>
      </div>

    </div>
  );
};

export default About;
