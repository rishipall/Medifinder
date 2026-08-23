import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import MedicineSearchInput from "../components/MedicineSearchInput";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle both ?names=Paracetamol,Amoxicillin and legacy ?name=Paracetamol
  const rawNames = searchParams.get("names") || searchParams.get("name") || "";
  const initialTags = rawNames ? rawNames.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const userLat = parseFloat(searchParams.get("lat"));
  const userLng = parseFloat(searchParams.get("lng"));
  const hasLocation = !isNaN(userLat) && !isNaN(userLng);

  const [stores, setStores] = useState([]);
  const [requestedMedicines, setRequestedMedicines] = useState(initialTags);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'fullMatch' | 'top5'
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchMultiSearchResults = async (tagsList) => {
    if (!tagsList || tagsList.length === 0) {
      setStores([]);
      setRequestedMedicines([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        names: tagsList,
        limit: 50
      };

      if (hasLocation) {
        payload.lat = userLat;
        payload.lng = userLng;
      }

      const { data } = await API.post("/medicines/search-multiple", payload);

      if (data.stores && data.stores.length > 0) {
        setStores(data.stores);
        setRequestedMedicines(data.requestedMedicines || tagsList);
      } else {
        setStores([]);
        setError(`No pharmacy stores found matching "${tagsList.join(", ")}". Try searching for alternative medicine names or generic formulas.`);
      }
    } catch (err) {
      console.error("Multi-search fetch error:", err);
      setError(err.response?.data?.message || "No stores found matching this search.");
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect browser location on mount if not in URL
  useEffect(() => {
    if (!hasLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("lat", pos.coords.latitude);
          newParams.set("lng", pos.coords.longitude);
          setSearchParams(newParams, { replace: true });
        },
        (err) => console.warn("Geolocation auto-prompt:", err.message),
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    const currentTags = rawNames ? rawNames.split(",").map((s) => s.trim()).filter(Boolean) : [];
    setRequestedMedicines(currentTags);
    if (currentTags.length > 0) {
      fetchMultiSearchResults(currentTags);
    } else {
      setStores([]);
      setLoading(false);
      setError("");
    }
  }, [rawNames, userLat, userLng, hasLocation]);

  const handleSearchTagsSubmit = (tags) => {
    const newParams = new URLSearchParams();
    if (tags && tags.length > 0) {
      newParams.set("names", tags.join(","));
    }
    if (hasLocation) {
      newParams.set("lat", userLat);
      newParams.set("lng", userLng);
    }
    setSearchParams(newParams);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("lat", pos.coords.latitude);
        newParams.set("lng", pos.coords.longitude);
        setSearchParams(newParams);
        setLocLoading(false);
      },
      () => setLocLoading(false)
    );
  };

  // Filter stores based on active filter mode
  const displayedStores = stores.filter((store) => {
    if (filterMode === "fullMatch") return store.isFullMatch;
    return true;
  }).slice(0, filterMode === "top5" ? 5 : 50);

  const fullMatchCount = stores.filter((s) => s.isFullMatch).length;

  return (
    <div className="pt-24 min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header section */}
      <div className="space-y-6 border-b border-slate-800 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/")}
              className="text-xs font-semibold text-teal-400 hover:underline flex items-center gap-1.5 mb-2"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Back to Home</span>
            </button>
            <h1 className="text-3xl font-extrabold text-white">
              {requestedMedicines.length > 0 ? (
                <>Store Availability for <span className="text-gradient">"{requestedMedicines.join(", ")}"</span></>
              ) : (
                <>Search Medicine <span className="text-gradient">Availability</span></>
              )}
            </h1>
            {hasLocation ? (
              <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
                <i className="fa-solid fa-location-dot"></i>
                <span>Showing nearby medical stores ({userLat.toFixed(4)}°, {userLng.toFixed(4)}°)</span>
              </p>
            ) : (
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>GPS location inactive</span>
                </span>
                <button
                  onClick={handleDetectLocation}
                  disabled={locLoading}
                  className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[11px] font-bold hover:bg-teal-500/30 transition-all flex items-center gap-1"
                >
                  {locLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-location-crosshairs"></i>}
                  <span>{locLoading ? "Detecting..." : "Enable GPS Distance"}</span>
                </button>
              </div>
            )}
          </div>

          <Link
            to="/consult"
            className="px-4 py-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold hover:bg-teal-500/30 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <i className="fa-solid fa-user-doctor"></i>
            <span>Ask AI Triage Assistant</span>
          </Link>
        </div>

        {/* Multi-Medicine Search Bar Component */}
        <MedicineSearchInput
          initialTags={requestedMedicines}
          onSearch={handleSearchTagsSubmit}
          placeholder="Search medicines or scan prescription image..."
        />
      </div>

      {/* Empty State when no tags searched */}
      {requestedMedicines.length === 0 && !loading && (
        <div className="glass-panel p-10 rounded-3xl text-center border border-slate-800 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-3xl mx-auto">
            <i className="fa-solid fa-magnifying-glass font-bold"></i>
          </div>
          <h3 className="text-xl font-bold text-white">Search One or Multiple Medicines</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Type medicine names above or click <strong>Scan Prescription Camera</strong> / <strong>Upload File</strong> to read handwritten doctor notes using Gemini AI.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-teal-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Checking store stock for {requestedMedicines.length} medicine(s)...</p>
        </div>
      )}

      {/* Error / No Stores Found State */}
      {error && !loading && requestedMedicines.length > 0 && (
        <div className="glass-panel p-10 rounded-3xl text-center border border-rose-500/40 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mx-auto">
            <i className="fa-solid fa-prescription-bottle-medical"></i>
          </div>
          <h3 className="text-xl font-bold text-white">No Matching Pharmacy Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Header Bar for Results Count & Filters */}
      {!loading && !error && requestedMedicines.length > 0 && stores.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Found <strong className="text-teal-400">{stores.length}</strong> pharmacy store{stores.length > 1 ? "s" : ""} matching your query ({requestedMedicines.length} medicine{requestedMedicines.length > 1 ? "s" : ""}):
          </div>

          {/* Filter Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === "all"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              All Stores ({stores.length})
            </button>

            {fullMatchCount > 0 && (
              <button
                onClick={() => setFilterMode("fullMatch")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterMode === "fullMatch"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-950/40"
                }`}
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>100% Full Match Only ({fullMatchCount})</span>
              </button>
            )}

            <button
              onClick={() => setFilterMode("top5")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === "top5"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              Top 5 Nearest Stores
            </button>
          </div>
        </div>
      )}

      {/* Multi-Medicine Store Cards Grid */}
      {!loading && !error && requestedMedicines.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedStores.map((item, index) => {
            const vendor = item.vendor;
            const availableNamesText = item.matchedItems.map((m) => m.name).join(", ");
            const whatsappMsg = `Hi ${vendor.storeName}, I saw your store on MediFind and want to inquire/order these medicines in stock: ${availableNamesText}. Total price approx ₹${item.totalPrice}.`;
            const cleanPhone = (vendor.phone || "").replace(/\D/g, "");
            const formattedWaPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

            return (
              <div
                key={vendor._id}
                onClick={() => navigate(`/store/${vendor._id}`)}
                className={`glass-card p-6 rounded-3xl cursor-pointer space-y-5 relative border transition-all hover:-translate-y-1 ${
                  item.isFullMatch
                    ? "border-emerald-500/60 shadow-xl shadow-emerald-500/10"
                    : "border-slate-800 hover:border-teal-500/40"
                }`}
              >
                {/* Full Match / Match Percentage Banner */}
                <div className="flex items-center justify-between gap-2">
                  {item.isFullMatch ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      ✓ 100% Full Match (All In Stock)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <i className="fa-solid fa-boxes-stacked"></i>
                      Partial Match ({item.availableCount}/{item.totalRequested} Available)
                    </span>
                  )}

                  {item.distance !== null && (
                    <span className="px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-bold flex items-center gap-1">
                      <i className="fa-solid fa-route text-teal-400"></i>
                      {item.distance} km
                    </span>
                  )}
                </div>

                {/* 🏪 Pharmacy Store Title & Address */}
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <i className="fa-solid fa-house-medical text-teal-400"></i>
                    <span>{vendor.storeName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                    <i className="fa-solid fa-map-pin text-slate-500"></i>
                    <span>{vendor.address}, {vendor.city}</span>
                  </p>
                </div>

                {/* 💊 Itemized Stock Breakdown Table */}
                <div className="space-y-2 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span>Requested Medicines</span>
                    <span>Price</span>
                  </div>

                  {/* Available Items */}
                  {item.matchedItems.map((med) => {
                    const hasDiscount = med.mrp && med.mrp > med.price;
                    const discountPct = hasDiscount ? Math.round(((med.mrp - med.price) / med.mrp) * 100) : 0;

                    return (
                      <div key={med._id} className="py-1.5 border-b border-slate-800/40 last:border-0 space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-emerald-400 text-sm font-bold">✓</span>
                            <span className="font-semibold text-white capitalize">{med.name}</span>
                            {med.dosageMg && (
                              <span className="text-[10px] text-teal-300 font-bold bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                                {med.dosageMg}
                              </span>
                            )}
                            {med.companyName && (
                              <span className="text-[10px] text-cyan-300 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-800/40">
                                {med.companyName}
                              </span>
                            )}
                            {med.requiresPrescription && (
                              <span className="text-[9px] text-rose-300 bg-rose-950/40 px-1 rounded border border-rose-800/50 uppercase font-bold">
                                Rx
                              </span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-bold text-teal-300">₹{med.price}</span>
                            {hasDiscount && (
                              <span className="text-[9px] text-emerald-400 font-bold block">
                                {discountPct}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                        {med.packSize && (
                          <div className="text-[10px] text-slate-400 pl-5">
                            Unit: {med.packSize}
                          </div>
                        )}
                      </div>
                    );
                  })}


                  {/* Missing Items */}
                  {item.missingMedicines.map((missingName, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400 text-sm font-bold">&times;</span>
                        <span className="line-through capitalize">{missingName}</span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-semibold">Out of stock</span>
                    </div>
                  ))}

                  {/* Total Cost Line */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">Est. Subtotal (Available):</span>
                    <span className="text-base text-teal-300">₹{item.totalPrice}</span>
                  </div>
                </div>

                {/* Communication Actions: Call & WhatsApp */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${vendor.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 font-bold text-xs border border-slate-800 transition-all flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-solid fa-phone text-teal-400"></i>
                    <span>Call Store</span>
                  </a>

                  <a
                    href={`https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-brands fa-whatsapp text-emerald-400 text-sm"></i>
                    <span>WhatsApp Order</span>
                  </a>
                </div>

                {/* View Details Footer */}
                <div className="pt-2 border-t border-slate-800/80 text-center">
                  <span className="text-xs text-teal-300 font-bold hover:underline flex items-center justify-center gap-1">
                    View Full Store Inventory &rarr;
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default SearchResults;
