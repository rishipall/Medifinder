import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import API from "../api/axios";

// Fix Leaflet marker icon bug in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const StoreDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const highlightName = (searchParams.get("highlight") || "").toLowerCase().trim();

  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [filterMode, setFilterMode] = useState(highlightName ? "searched_only" : "all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const [vendorRes, medRes] = await Promise.all([
          API.get(`/vendors/${id}`),
          API.get(`/medicines/store/${id}`),
        ]);
        setStore(vendorRes.data);
        setMedicines(medRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-teal-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Loading store details...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl text-center border border-rose-500/40 space-y-3 max-w-sm">
          <i className="fa-solid fa-store-slash text-3xl text-rose-400"></i>
          <h3 className="text-lg font-bold text-white">Store Not Found</h3>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white border border-slate-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const hasLocation = store.lat !== 0 && store.lng !== 0;

  // Filter medicines based on user selection
  const displayedMedicines = medicines.filter((med) => {
    if (filterMode === "searched_only" && highlightName) {
      return med.name.toLowerCase().includes(highlightName);
    }
    return true;
  });

  const cleanPhone = (phoneStr) => {
    if (!phoneStr) return "";
    let digits = phoneStr.replace(/\D/g, "");
    if (digits.length === 10) digits = "91" + digits;
    return digits;
  };

  return (
    <div className="pt-24 min-h-screen pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-teal-400 hover:underline flex items-center gap-1.5 mb-4"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back to Search Results</span>
        </button>
      </div>

      {/* Store Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/80 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center text-3xl font-bold flex-shrink-0">
              <i className="fa-solid fa-house-medical"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{store.storeName}</h1>
              <p className="text-xs text-teal-400 font-medium mt-1 flex items-center gap-2">
                <i className="fa-solid fa-user"></i>
                <span>Owner: {store.name}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Phone Call Dialer & WhatsApp Chat */}
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            <a
              href={`tel:${store.phone}`}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-phone-volume"></i>
              <span>Call Now</span>
            </a>

            <a
              href={`https://wa.me/${cleanPhone(store.phone)}?text=${encodeURIComponent(
                `Hi ${store.storeName}, I found your pharmacy on MediFind and want to inquire about medicine availability.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-brands fa-whatsapp text-lg"></i>
              <span>WhatsApp Now</span>
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Store Address</span>
            <div className="text-white font-semibold flex items-center gap-2">
              <i className="fa-solid fa-map-pin text-teal-400"></i>
              <span>{store.address}, {store.city}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">WhatsApp & Contact</span>
            <a
              href={`https://wa.me/${cleanPhone(store.phone)}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline font-semibold flex items-center gap-2"
            >
              <i className="fa-brands fa-whatsapp text-base"></i>
              <span>{store.phone} (Click to Chat)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Store Location Map */}
      {hasLocation ? (
        <div className="glass-panel p-2 rounded-3xl border border-slate-700/80 overflow-hidden shadow-2xl">
          <div className="h-72 w-full rounded-2xl overflow-hidden relative z-0">
            <MapContainer center={[store.lat, store.lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[store.lat, store.lng]}>
                <Popup>{store.storeName}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <i className="fa-solid fa-circle-info text-amber-400 text-base"></i>
          <span>This store has not set exact GPS map coordinates yet.</span>
        </div>
      )}

      {/* Medicines Inventory List */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/80 space-y-6 shadow-2xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-capsules text-teal-400"></i>
              <span>Store Medicines</span>
            </h2>
            {highlightName && (
              <p className="text-xs text-slate-400 mt-1">
                Showing results for <span className="text-teal-400 font-bold">"{highlightName}"</span>
              </p>
            )}
          </div>

          {/* Filter Toggle Buttons */}
          {highlightName && (
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterMode("searched_only")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === "searched_only"
                    ? "bg-teal-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Searched Medicine Only ({medicines.filter(m => m.name.toLowerCase().includes(highlightName)).length})
              </button>
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === "all"
                    ? "bg-teal-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Show All Store Inventory ({medicines.length})
              </button>
            </div>
          )}
        </div>

        {displayedMedicines.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 space-y-3">
            <i className="fa-solid fa-box-open text-3xl text-slate-600"></i>
            <p>No matching medicine found in this store's inventory.</p>
            {filterMode === "searched_only" && (
              <button
                onClick={() => setFilterMode("all")}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
              >
                Show All Store Inventory
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMedicines.map((med) => {
              const isMatch = highlightName && med.name.toLowerCase().includes(highlightName);
              const sellingPrice = med.price || 0;
              const mrpPrice = med.mrp || 0;
              const hasDiscount = mrpPrice > sellingPrice;
              const discountPct = hasDiscount ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;

              return (
                <div
                  key={med._id}
                  className={`p-4 rounded-2xl flex flex-col justify-between gap-3 transition-all relative ${
                    isMatch
                      ? "bg-teal-950/40 border-2 border-teal-400 shadow-lg shadow-teal-500/20"
                      : "bg-slate-900/80 border border-slate-800 hover:border-teal-500/40"
                  }`}
                >
                  {isMatch && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-md bg-teal-400 text-slate-950 text-[9px] font-extrabold uppercase tracking-wider">
                      ✓ Searched Match
                    </span>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-white text-sm capitalize">💊 {med.name}</span>
                      {med.requiresPrescription && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-extrabold uppercase">
                          Rx
                        </span>
                      )}
                    </div>

                    {med.companyName && (
                      <div className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                        <i className="fa-solid fa-building text-[10px]"></i>
                        <span>Brand: {med.companyName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 capitalize">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">{med.category || "General"}</span>
                      {med.dosageMg && <span>· {med.dosageMg}</span>}
                    </div>

                    {med.packSize && (
                      <div className="text-[11px] text-slate-400">
                        Pack: <span className="text-slate-300">{med.packSize}</span>
                      </div>
                    )}

                    {med.composition && (
                      <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded-lg border border-slate-800 mt-1">
                        Formula: {med.composition}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-teal-400">₹{sellingPrice}</span>
                        {hasDiscount && (
                          <span className="text-xs text-slate-500 line-through">₹{mrpPrice}</span>
                        )}
                      </div>
                      {hasDiscount && (
                        <span className="text-[9px] font-bold text-emerald-400">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        med.inStock
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {med.inStock ? "✓ In Stock" : "✕ Out of Stock"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        )}
      </div>

    </div>
  );
};

export default StoreDetail;
