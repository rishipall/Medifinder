import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {Link} from "react-router-dom";
const VendorDashboard = () => {
  const { vendor } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  
  // Comprehensive Inventory Form State
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    dosageMg: "",
    packSize: "",
    category: "tablet",
    price: "",
    mrp: "",
    stockQuantity: "20",
    inStock: true,
    composition: "",
    requiresPrescription: false,
    expiryDate: "",
    batchNumber: ""
  });

  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Navigation, Search, Filter & Pagination Controls for 1000+ Items
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'inStock' | 'lowStock' | 'outOfStock'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState("name_asc"); // 'name_asc' | 'stock_asc' | 'stock_desc' | 'price_asc' | 'price_desc'
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!vendor) navigate("/vendor/login");
  }, [vendor, navigate]);

  const fetchMedicines = async () => {
    try {
      const vendorId = vendor?.id || vendor?._id;
      if (!vendorId) return;
      const { data } = await API.get(`/medicines/store/${vendorId}`);
      setMedicines(data);
    } catch (err) {
      console.error("Error fetching vendor medicines:", err);
    }
  };

  useEffect(() => {
    if (vendor) fetchMedicines();
  }, [vendor]);

  // Reset pagination to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, selectedCategoryFilter, searchFilter, sortBy, itemsPerPage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalVal = type === "checkbox" ? checked : value;
    if (name === "inStock") finalVal = value === "true";

    // Real-time numeric validations
    if (name === "price" || name === "mrp") {
      if (typeof finalVal === "string" && finalVal !== "" && finalVal !== "." && isNaN(Number(finalVal))) {
        finalVal = finalVal.replace(/[^0-9.]/g, "");
        showMessage(`Only numbers are allowed for ${name === "price" ? "Price" : "MRP"}. ❌`, "error");
      }
    }

    if (name === "stockQuantity") {
      if (typeof finalVal === "string" && /\D/.test(finalVal)) {
        finalVal = finalVal.replace(/\D/g, "");
        showMessage("Only numbers (digits 0-9) are allowed for Stock Quantity. ❌", "error");
      }
    }

    setForm((prev) => ({ ...prev, [name]: finalVal }));
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3500);
  };

  const resetForm = () => {
    setForm({
      name: "",
      companyName: "",
      dosageMg: "",
      packSize: "",
      category: "tablet",
      price: "",
      mrp: "",
      stockQuantity: "20",
      inStock: true,
      composition: "",
      requiresPrescription: false,
      expiryDate: "",
      batchNumber: ""
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/medicines/${editId}`, form);
        showMessage("Medicine inventory details updated successfully ✅");
      } else {
        await API.post("/medicines", form);
        showMessage("New medicine added to pharmacy inventory ✅");
      }
      resetForm();
      fetchMedicines();
    } catch (err) {
      showMessage(err.response?.data?.message || "Error occurred saving medicine", "error");
    }
  };

  const handleEdit = (med) => {
    setForm({
      name: med.name || "",
      companyName: med.companyName || "",
      dosageMg: med.dosageMg || "",
      packSize: med.packSize || "",
      category: med.category || "tablet",
      price: med.price || "",
      mrp: med.mrp || "",
      stockQuantity: med.stockQuantity !== undefined ? med.stockQuantity : "20",
      inStock: med.inStock !== undefined ? med.inStock : true,
      composition: med.composition || "",
      requiresPrescription: Boolean(med.requiresPrescription),
      expiryDate: med.expiryDate || "",
      batchNumber: med.batchNumber || ""
    });
    setEditId(med._id);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine from store inventory?")) return;
    try {
      await API.delete(`/medicines/${id}`);
      showMessage("Medicine deleted from inventory ✅");
      fetchMedicines();
    } catch {
      showMessage("Delete failed", "error");
    }
  };

  // Quick Stock Quantity Update (+ / -)
  const handleQuickStockUpdate = async (med, delta) => {
    const currentQty = parseInt(med.stockQuantity) || 0;
    const newQty = Math.max(0, currentQty + delta);
    try {
      await API.put(`/medicines/${med._id}`, { stockQuantity: newQty });
      fetchMedicines();
    } catch (err) {
      console.error("Quick stock update failed:", err);
    }
  };

  // KPI Calculations
  const totalCount = medicines.length;
  const inStockCount = medicines.filter((m) => m.inStock && (m.stockQuantity === undefined || m.stockQuantity > 0)).length;
  const lowStockCount = medicines.filter((m) => m.stockQuantity > 0 && m.stockQuantity < 10).length;
  const outOfStockCount = medicines.filter((m) => !m.inStock || m.stockQuantity === 0).length;

  // Master Filter & Search Pipeline
  const filteredMedicines = medicines.filter((med) => {
    const stockQty = med.stockQuantity !== undefined ? parseInt(med.stockQuantity) : 10;
    const isLowStock = stockQty > 0 && stockQty < 10;
    const isOutOfStock = !med.inStock || stockQty === 0;

    // Status Filter match
    if (statusFilter === "inStock" && isOutOfStock) return false;
    if (statusFilter === "lowStock" && !isLowStock) return false;
    if (statusFilter === "outOfStock" && !isOutOfStock) return false;

    // Category match
    if (selectedCategoryFilter !== "all" && med.category !== selectedCategoryFilter) return false;

    // Keyword match
    const term = searchFilter.toLowerCase().trim();
    if (term) {
      const nameMatch = med.name && med.name.toLowerCase().includes(term);
      const companyMatch = med.companyName && med.companyName.toLowerCase().includes(term);
      const compMatch = med.composition && med.composition.toLowerCase().includes(term);
      const batchMatch = med.batchNumber && med.batchNumber.toLowerCase().includes(term);
      if (!nameMatch && !companyMatch && !compMatch && !batchMatch) return false;
    }

    return true;
  });

  // Sorting
  filteredMedicines.sort((a, b) => {
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "stock_asc") return (a.stockQuantity || 0) - (b.stockQuantity || 0);
    if (sortBy === "stock_desc") return (b.stockQuantity || 0) - (a.stockQuantity || 0);
    if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
    return 0;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMedicines = filteredMedicines.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="pt-24 min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-teal-400 uppercase bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
            Pharmacy Inventory Portal 3.0 (Scale Ready 1000+ Items)
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
            <i className="fa-solid fa-house-medical text-teal-400"></i>
            <span>{vendor?.storeName}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">High-density data table & pagination engine designed for large pharmacy inventories.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/vendor/profile"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <i className="fa-solid fa-id-card text-teal-400"></i>
            <span>Edit Store Profile</span>
          </Link>
        </div>
      </div>

      {/* Approval Status Banner */}
      {vendor && vendor.isApproved === false && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center gap-3 shadow-lg">
          <i className="fa-solid fa-clock-rotate-left text-amber-400 text-lg"></i>
          <div>
            <div className="font-bold text-amber-300">⚠️ Account Pending Super Admin Approval</div>
            <div className="text-[11px] text-amber-200/80 mt-0.5">Your pharmacy shop registration has been received. You can add and manage your medicine inventory below, but your shop will remain hidden from public patient search until approved by Super Admin.</div>
          </div>
        </div>
      )}


      {/* Overview Stats KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`glass-panel p-4 rounded-2xl border text-center space-y-1 transition-all ${
            statusFilter === "all" ? "border-teal-500/80 bg-teal-950/20" : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="text-3xl font-extrabold text-white">{totalCount}</div>
          <div className="text-xs text-slate-400">Total Medicines</div>
        </button>

        <button
          onClick={() => setStatusFilter("inStock")}
          className={`glass-panel p-4 rounded-2xl border text-center space-y-1 transition-all ${
            statusFilter === "inStock" ? "border-emerald-500 bg-emerald-950/40" : "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/60"
          }`}
        >
          <div className="text-3xl font-extrabold text-emerald-400">{inStockCount}</div>
          <div className="text-xs text-emerald-300">In Stock</div>
        </button>

        <button
          onClick={() => setStatusFilter("lowStock")}
          className={`glass-panel p-4 rounded-2xl border text-center space-y-1 transition-all ${
            statusFilter === "lowStock" ? "border-amber-500 bg-amber-950/40" : "border-amber-500/30 bg-amber-950/20 hover:border-amber-500/60"
          }`}
        >
          <div className="text-3xl font-extrabold text-amber-400">{lowStockCount}</div>
          <div className="text-xs text-amber-300">Low Stock (&lt;10)</div>
        </button>

        <button
          onClick={() => setStatusFilter("outOfStock")}
          className={`glass-panel p-4 rounded-2xl border text-center space-y-1 transition-all ${
            statusFilter === "outOfStock" ? "border-rose-500 bg-rose-950/40" : "border-rose-500/30 bg-rose-950/20 hover:border-rose-500/60"
          }`}
        >
          <div className="text-3xl font-extrabold text-rose-400">{outOfStockCount}</div>
          <div className="text-xs text-rose-300">Out of Stock</div>
        </button>
      </div>

      {/* Add / Edit Inventory Form Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/80 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i className={`fa-solid ${editId ? "fa-pen-to-square text-amber-400" : "fa-plus-circle text-teal-400"}`}></i>
            <span>{editId ? "Edit Inventory Item Details" : "Add New Medicine to Inventory"}</span>
          </h2>
          {editId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-rose-400 hover:underline font-bold flex items-center gap-1"
            >
              <i className="fa-solid fa-xmark"></i> Cancel Edit Mode
            </button>
          )}
        </div>

        {message.text && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/60 border-rose-500/50 text-rose-200"
            }`}
          >
            <i className={`fa-solid ${message.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}`}></i>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Medicine Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Medicine Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Paracetamol, Amoxicillin, Crocin"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* 2. Company / Brand Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company / Brand Name
              </label>
              <input
                type="text"
                name="companyName"
                placeholder="e.g. Cipla, Sun Pharma, Mankind, GSK"
                value={form.companyName}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* 3. Strength / Dosage (mg / ml) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Strength / Dosage (mg / ml)
              </label>
              <input
                type="text"
                name="dosageMg"
                placeholder="e.g. 500mg, 650mg, 10ml, 250mg/5ml"
                value={form.dosageMg}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* 4. Pack Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pack Size / Unit Packaging
              </label>
              <input
                type="text"
                name="packSize"
                placeholder="e.g. Strip of 10 Tablets, 100ml Bottle, 1 Vial"
                value={form.packSize}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* 5. Category (Form Factor) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category (Form Factor)</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none capitalize"
              >
                <option value="tablet">💊 Tablet / Capsule</option>
                <option value="syrup">🧪 Syrup / Liquid</option>
                <option value="injection">💉 Injection / Vial</option>
                <option value="drops">💧 Drop (Eye/Ear/Pediatric)</option>
                <option value="cream">🧴 Cream / Ointment / Gel</option>
                <option value="other">📦 Others</option>
              </select>
            </div>

            {/* 6. Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selling Price (₹) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                name="price"
                placeholder="e.g. 45"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none font-bold"
              />
            </div>

            {/* 7. M.R.P Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                M.R.P. Price (₹)
              </label>
              <input
                type="text"
                inputMode="decimal"
                name="mrp"
                placeholder="e.g. 55 (Displays discount %)"
                value={form.mrp}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* 8. Stock Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stock Quantity (Units)
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="stockQuantity"
                placeholder="e.g. 50"
                value={form.stockQuantity}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* 9. Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Expiry Date (YYYY-MM)
              </label>
              <input
                type="month"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* 10. Chemical Composition */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Active Chemical Composition / Salt Formula
              </label>
              <input
                type="text"
                name="composition"
                placeholder="e.g. Paracetamol IP 650mg + Caffeine 30mg"
                value={form.composition}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* 11. Prescription Requirement Toggle */}
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="requiresPrescription"
                  checked={form.requiresPrescription}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
              <span className="text-xs font-bold text-slate-300">
                {form.requiresPrescription ? "Rx Prescription Required" : "OTC (Over The Counter)"}
              </span>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <i className={`fa-solid ${editId ? "fa-floppy-disk" : "fa-plus"}`}></i>
              <span>{editId ? "Update Medicine Details" : "Save Medicine to Store"}</span>
            </button>
            
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Inventory Search & Toolbar for 1000+ Items */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 space-y-4 shadow-xl">
        
        {/* Top Control Bar: Search, View Mode Toggle, Sort, Rows Per Page */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-boxes-stacked text-teal-400"></i>
              <span>Inventory List</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
              {filteredMedicines.length} Item{filteredMedicines.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Realtime Search Input */}
            <div className="relative flex-1 sm:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="text"
                placeholder="Search name, brand, formula..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none font-semibold"
            >
              <option value="name_asc">Sort: Name (A-Z)</option>
              <option value="stock_asc">Sort: Stock Qty (Low-High)</option>
              <option value="stock_desc">Sort: Stock Qty (High-Low)</option>
              <option value="price_asc">Sort: Price (Low-High)</option>
              <option value="price_desc">Sort: Price (High-Low)</option>
            </select>

            {/* Items Per Page Selector */}
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none font-semibold"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>

            {/* View Mode Switcher: Compact Table vs Grid Cards */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "table"
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Compact Table View (Recommended for 1000+ items)"
              >
                <i className="fa-solid fa-[#050811] fa-table-cells text-xs"></i>
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "cards"
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Grid Card View"
              >
                <i className="fa-solid fa-[#050811] fa-table-columns text-xs"></i>
                <span>Cards</span>
              </button>
            </div>

          </div>
        </div>

        {/* Status Filter Tabs & Category Filter Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "all"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All ({medicines.length})
            </button>
            <button
              onClick={() => setStatusFilter("inStock")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "inStock"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-emerald-300"
              }`}
            >
              ✓ In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setStatusFilter("lowStock")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "lowStock"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-amber-300"
              }`}
            >
              ⚠️ Low Stock (&lt;10) ({lowStockCount})
            </button>
            <button
              onClick={() => setStatusFilter("outOfStock")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "outOfStock"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-rose-300"
              }`}
            >
              ✕ Out of Stock ({outOfStockCount})
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-xs font-semibold text-slate-500 mr-1">Category:</span>
            {[
              { id: "all", label: "All Form Factors" },
              { id: "tablet", label: "💊 Tablet" },
              { id: "syrup", label: "🧪 Syrup" },
              { id: "injection", label: "💉 Injection" },
              { id: "drops", label: "💧 Drop" },
              { id: "cream", label: "🧴 Cream" },
              { id: "other", label: "📦 Others" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedCategoryFilter === cat.id
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Inventory Item Display */}
      {filteredMedicines.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3 rounded-3xl border border-slate-800">
          <i className="fa-solid fa-box-open text-4xl text-slate-600"></i>
          <h3 className="text-base font-bold text-white">No Medicines Match Your Filter</h3>
          <p className="text-xs text-slate-400">
            {searchFilter || selectedCategoryFilter !== "all" || statusFilter !== "all"
              ? "Try clearing your search query or selecting a different status/category filter."
              : "Add your first medicine using the form above."}
          </p>
        </div>
      ) : viewMode === "table" ? (
        
        /* 📁 HIGH-DENSITY COMPACT DATA TABLE VIEW (Ideal for 1000+ Items) */
        <div className="glass-panel rounded-3xl border border-slate-700/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Table Header */}
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Medicine & Brand</th>
                  <th className="py-3.5 px-3">Form & Dosage</th>
                  <th className="py-3.5 px-3">Pack Size</th>
                  <th className="py-3.5 px-3 text-right">Price / MRP</th>
                  <th className="py-3.5 px-3 text-center">Stock & Status</th>
                  <th className="py-3.5 px-3 text-center">Rx</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800/60">
                {paginatedMedicines.map((med) => {
                  const stockQty = med.stockQuantity !== undefined ? parseInt(med.stockQuantity) : 10;
                  const isLowStock = stockQty > 0 && stockQty < 10;
                  const isOutOfStock = !med.inStock || stockQty === 0;
                  const sellingPrice = med.price || 0;
                  const mrpPrice = med.mrp || 0;
                  const hasDiscount = mrpPrice > sellingPrice;
                  const discountPct = hasDiscount ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;

                  return (
                    <tr
                      key={med._id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isOutOfStock ? "bg-rose-950/10" : isLowStock ? "bg-amber-950/10" : ""
                      }`}
                    >
                      {/* 1. Medicine Name & Brand */}
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="capitalize text-sm font-extrabold text-white flex items-center gap-1.5">
                          <span>{med.name}</span>
                          {med.expiryDate && (
                            <span className="text-[10px] text-amber-300 font-mono font-normal">
                              (Exp: {med.expiryDate})
                            </span>
                          )}
                        </div>
                        {med.companyName && (
                          <div className="text-[11px] text-cyan-400 font-semibold">
                            By {med.companyName}
                          </div>
                        )}
                        {med.composition && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs font-mono">
                            {med.composition}
                          </div>
                        )}
                      </td>

                      {/* 2. Category & Dosage */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 text-[11px] font-bold capitalize">
                          {med.category || "General"}
                        </span>
                        {med.dosageMg && (
                          <div className="text-[11px] text-slate-300 font-bold mt-0.5">
                            {med.dosageMg}
                          </div>
                        )}
                      </td>

                      {/* 3. Pack Size */}
                      <td className="py-3 px-3 text-slate-300">
                        {med.packSize || "1 Unit"}
                      </td>

                      {/* 4. Price & MRP */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-extrabold text-teal-300 text-sm">₹{sellingPrice}</div>
                        {hasDiscount && (
                          <div className="text-[10px] text-slate-500 line-through">
                            MRP ₹{mrpPrice} ({discountPct}% OFF)
                          </div>
                        )}
                      </td>

                      {/* 5. Stock Qty & Status */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          
                          {/* Quick Adjuster */}
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                            <button
                              onClick={() => handleQuickStockUpdate(med, -5)}
                              className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold flex items-center justify-center"
                              title="-5 Stock"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-bold text-white px-2">{stockQty}</span>
                            <button
                              onClick={() => handleQuickStockUpdate(med, 5)}
                              className="w-5 h-5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded text-xs font-bold flex items-center justify-center"
                              title="+5 Stock"
                            >
                              +
                            </button>
                          </div>

                          {/* Status Pill */}
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                              ✕ Out
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold animate-pulse">
                              ⚠️ Low ({stockQty})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              ✓ OK
                            </span>
                          )}

                        </div>
                      </td>

                      {/* 6. Prescription Required Badge */}
                      <td className="py-3 px-3 text-center">
                        {med.requiresPrescription ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold uppercase">
                            Rx
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">OTC</span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(med)}
                            className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs flex items-center justify-center transition-all"
                            title="Edit Medicine"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(med._id)}
                            className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs flex items-center justify-center transition-all"
                            title="Delete Medicine"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : (
        
        /* 🎴 GRID CARD VIEW */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedMedicines.map((med) => {
            const stockQty = med.stockQuantity !== undefined ? parseInt(med.stockQuantity) : 10;
            const isLowStock = stockQty > 0 && stockQty < 10;
            const isOutOfStock = !med.inStock || stockQty === 0;
            const sellingPrice = med.price || 0;
            const mrpPrice = med.mrp || 0;
            const hasDiscount = mrpPrice > sellingPrice;
            const discountPct = hasDiscount ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;

            return (
              <div
                key={med._id}
                className={`glass-panel p-5 rounded-3xl border space-y-4 relative transition-all ${
                  isOutOfStock
                    ? "border-rose-900/40 bg-slate-950/40"
                    : isLowStock
                    ? "border-amber-500/40 bg-amber-950/10"
                    : "border-slate-800 hover:border-teal-500/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[11px] font-bold uppercase tracking-wider">
                      {med.category || "General"}
                    </span>
                    {med.requiresPrescription && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-extrabold uppercase">
                        Rx Required
                      </span>
                    )}
                  </div>

                  {isOutOfStock ? (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
                      ✕ Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold animate-pulse">
                      ⚠️ Low Stock ({stockQty} left)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                      ✓ In Stock ({stockQty} units)
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-base capitalize flex items-center justify-between gap-2">
                    <span>{med.name}</span>
                    {med.dosageMg && (
                      <span className="text-xs text-teal-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {med.dosageMg}
                      </span>
                    )}
                  </h3>

                  {med.companyName && (
                    <div className="text-xs text-cyan-400 font-semibold mt-0.5 flex items-center gap-1">
                      <i className="fa-solid fa-building text-[10px]"></i>
                      <span>Brand: {med.companyName}</span>
                    </div>
                  )}

                  {med.packSize && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Packaging: <strong className="text-slate-300">{med.packSize}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-teal-300">₹{sellingPrice}</span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-500 line-through">₹{mrpPrice}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(med)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(med._id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 📄 PAGINATION FOOTER BAR (For 1000+ Items Navigation) */}
      {filteredMedicines.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          
          <div className="text-slate-400">
            Showing <strong className="text-white">{startIndex + 1}</strong> - <strong className="text-white">{Math.min(startIndex + itemsPerPage, filteredMedicines.length)}</strong> of <strong className="text-teal-400">{filteredMedicines.length}</strong> medicines (Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>)
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all font-bold"
              title="First Page"
            >
              &laquo; First
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all font-bold"
            >
              &lsaquo; Prev
            </button>

            {/* Numeric Page Buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === pageNum
                      ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all font-bold"
            >
              Next &rsaquo;
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all font-bold"
              title="Last Page"
            >
              Last &raquo;
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default VendorDashboard;
