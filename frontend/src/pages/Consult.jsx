import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const SYMPTOMS_LIST = [
  { id: "fever", label: "Fever / Temperature", icon: "fa-temperature-high", color: "text-amber-400" },
  { id: "headache", label: "Migraine / Headache", icon: "fa-brain", color: "text-purple-400" },
  { id: "cough", label: "Cough / Sore Throat", icon: "fa-head-side-cough", color: "text-teal-400" },
  { id: "cold", label: "Cold & Runny Nose", icon: "fa-box-tissue", color: "text-cyan-400" },
  { id: "breath", label: "Shortness of Breath", icon: "fa-lungs", color: "text-cyan-400" },
  { id: "fatigue", label: "Fatigue & Weakness", icon: "fa-battery-quarter", color: "text-rose-400" },
  { id: "chest", label: "Chest Discomfort", icon: "fa-heart-crack", color: "text-rose-500" },
  { id: "stomach", label: "Stomach Discomfort", icon: "fa-capsules", color: "text-amber-500" },
  { id: "joint", label: "Joint & Muscle Pain", icon: "fa-bone", color: "text-emerald-400" },
  { id: "allergy", label: "Skin Rash / Allergy", icon: "fa-hand-dots", color: "text-purple-400" },
];

const Consult = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [duration, setDuration] = useState("1-2 Days");
  const [severity, setSeverity] = useState("Moderate");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const toggleSymptom = (label) => {
    if (selectedSymptoms.includes(label)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== label));
    } else {
      setSelectedSymptoms([...selectedSymptoms, label]);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setError("Please select at least one symptom to evaluate.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await API.post("/consult/analyze", {
        symptoms: selectedSymptoms,
        duration,
        severity,
        additionalInfo,
      });

      if (res.data && res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data?.message || "Failed to analyze symptoms. Please try again.");
      }
    } catch (err) {
      console.error("Consultation error:", err);
      setError("Network or server error while processing AI evaluation.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMedicine = (medicineName) => {
    navigate(`/search?name=${encodeURIComponent(medicineName)}`);
  };

  return (
    <div className="pt-24 min-h-screen pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold tracking-wider text-teal-400 uppercase bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
          <i className="fa-solid fa-microchip mr-1.5"></i>
          AI Health Diagnostic Engine
        </span>
        <h1 className="text-4xl font-extrabold text-white">AI Symptom Consultation</h1>
        <p className="text-slate-300 text-sm">
          Select your symptoms to receive real-time medical triage guidance and direct links to search needed OTC medicines in nearby stores.
        </p>
      </div>

      {/* Main Glass Form Container */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-700/80 space-y-8 shadow-2xl relative overflow-hidden">
        
        {/* Step 1: Select Symptoms */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-notes-medical text-teal-400"></i>
              <span>Select Your Symptoms</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Selected: <strong className="text-teal-400">{selectedSymptoms.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {SYMPTOMS_LIST.map((item) => {
              const isSelected = selectedSymptoms.includes(item.label);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSymptom(item.label)}
                  className={`p-3.5 rounded-2xl text-left text-xs font-semibold transition-all flex items-center justify-between border ${
                    isSelected
                      ? "bg-teal-500/20 border-teal-500 text-teal-200 shadow-lg shadow-teal-500/10"
                      : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-teal-500/40"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <i className={`fa-solid ${item.icon} ${item.color} text-sm`}></i>
                    <span>{item.label}</span>
                  </span>
                  <i
                    className={`fa-solid fa-circle-check text-sm ${
                      isSelected ? "text-teal-400" : "text-slate-700"
                    }`}
                  ></i>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Duration & Severity Controls */}
        <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Symptom Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
            >
              <option value="Today (Less than 24h)">Today (Less than 24h)</option>
              <option value="1-2 Days">1-2 Days</option>
              <option value="3-5 Days">3-5 Days</option>
              <option value="1 Week+">1 Week or longer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
            >
              <option value="Mild">Mild (Noticeable but manageable)</option>
              <option value="Moderate">Moderate (Interferes with work/sleep)</option>
              <option value="High">High (Severe discomfort / acute pain)</option>
            </select>
          </div>
        </div>

        {/* Additional details */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Additional Details / Notes (Optional)
          </label>
          <textarea
            placeholder="Describe specific symptoms e.g., fever started last night at 101°F..."
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400 text-base"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-3 ${
            loading
              ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
              : "bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95"
          }`}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner animate-spin text-teal-400 text-base"></i>
              <span>Analyzing Symptoms with AI Engine...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles text-base"></i>
              <span>Run AI Triage Analysis & Get Advice</span>
            </>
          )}
        </button>

      </div>

      {/* AI Assessment Results Card */}
      {result && (
        <div
          className={`glass-panel p-6 sm:p-8 rounded-3xl border space-y-6 shadow-2xl transition-all ${
            result.riskColor === "rose"
              ? "border-rose-500/50 bg-rose-950/20"
              : result.riskColor === "amber"
              ? "border-amber-500/50 bg-amber-950/20"
              : "border-teal-500/50 bg-teal-950/20"
          }`}
        >
          {/* Header Risk Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  result.riskColor === "rose"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : result.riskColor === "amber"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-ping ${
                    result.riskColor === "rose"
                      ? "bg-rose-400"
                      : result.riskColor === "amber"
                      ? "bg-amber-400"
                      : "bg-teal-400"
                  }`}
                ></span>
                Triage Level: {result.riskLevel} Risk
              </span>

              <h2 className="text-2xl font-bold text-white mt-2">{result.title}</h2>
            </div>
          </div>

          {/* Assessment Summary */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-sm leading-relaxed">
            {result.summary}
          </div>

          {/* Related Conditions */}
          {result.possibleConditions && result.possibleConditions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Possible Related Conditions:
              </span>
              <div className="flex flex-wrap gap-2">
                {result.possibleConditions.map((cond, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold"
                  >
                    {cond}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Medicines & Direct Search */}
          {result.suggestedMedicines && result.suggestedMedicines.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Suggested Over-the-Counter Remedies & Ingredients:
              </span>
              <div className="grid gap-3">
                {result.suggestedMedicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-white text-base">{med.name}</div>
                        {med.inDatabase !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              med.inDatabase
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {med.inDatabase ? "✓ In Database Stores" : "Not listed in DB stores"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{med.purpose}</div>
                      {med.dosageInfo && (
                        <div className="text-[11px] text-teal-400 mt-1 italic">
                          <i className="fa-solid fa-circle-info mr-1"></i>
                          {med.dosageInfo}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSearchMedicine(med.name)}
                      className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <i className="fa-solid fa-magnifying-glass"></i>
                      <span>Search In DB Stores</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Home Care Advice */}
          {result.homeCareAdvice && result.homeCareAdvice.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Self-Care Guidelines:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-5">
                {result.homeCareAdvice.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* When to see doctor */}
          {result.whenToSeeDoctor && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs leading-relaxed">
              <i className="fa-solid fa-user-doctor mr-1.5 text-amber-400"></i>
              <strong>When to seek urgent medical consultation:</strong> {result.whenToSeeDoctor}
            </div>
          )}

          {/* Disclaimer */}
          <div className="pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-500 italic">
            {result.disclaimer}
          </div>
        </div>
      )}

    </div>
  );
};

export default Consult;
