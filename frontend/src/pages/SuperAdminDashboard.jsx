import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";




const SuperAdminDashboard = () => {
  const { admin, logoutAdmin } = useAuth();
  const { theme, changeTheme, themes } = useTheme();
  const navigate = useNavigate();


  const [stats, setStats] = useState({ totalStores: 0, pendingStores: 0, approvedStores: 0 });
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ text: "", type: "" });

  // Filter & Search Controls
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'approved'
  const [searchFilter, setSearchFilter] = useState("");

  // Modal States: Create & Edit Store
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editStore, setEditStore] = useState(null); // null or store object

  // Form State for Create / Edit
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    phone: "",
    address: "",
    city: "",
    lat: "0",
    lng: "0",
    isApproved: true,
  });

  useEffect(() => {
    if (!admin) {
      navigate("/admin/login");
    } else {
      fetchStores();
    }
  }, [admin, navigate]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/stores");
      setStats(data.stats);
      setStores(data.stores);
    } catch (err) {
      console.error("Fetch stores error:", err);
      setError(err.response?.data?.message || "Failed to load medical stores.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = "success") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: "", type: "" }), 3500);
  };

  // Toggle Approval Status (1-click Approve / Revoke)
  const handleToggleApproval = async (store) => {
    const newStatus = !store.isApproved;
    try {
      await API.put(`/admin/stores/${store._id}/approve`, { isApproved: newStatus });
      showToast(`Store "${store.storeName}" is now ${newStatus ? "Approved ✅" : "Pending/Suspended ⚠️"}`);
      fetchStores();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update store status", "error");
    }
  };

  // Delete Store
  const handleDeleteStore = async (store) => {
    if (
      !window.confirm(
        `Are you sure you want to delete medical store "${store.storeName}"? This will also remove all their listed medicines.`
      )
    )
      return;

    try {
      await API.delete(`/admin/stores/${store._id}`);
      showToast(`Store "${store.storeName}" deleted successfully ✅`);
      fetchStores();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete store", "error");
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setForm({
      name: "",
      email: "",
      password: "Pharmacy#Store2026",
      storeName: "",
      phone: "",
      address: "",
      city: "",
      lat: "0",
      lng: "0",
      isApproved: true,
    });
    setEditStore(null);
    setShowCreateModal(true);
  };


  // Open Edit Modal
  const openEditModal = (store) => {
    setForm({
      name: store.name || "",
      email: store.email || "",
      password: "", // leave blank to keep unchanged
      storeName: store.storeName || "",
      phone: store.phone || "",
      address: store.address || "",
      city: store.city || "",
      lat: store.lat !== undefined ? store.lat.toString() : "0",
      lng: store.lng !== undefined ? store.lng.toString() : "0",
      isApproved: store.isApproved !== undefined ? Boolean(store.isApproved) : true,
    });
    setEditStore(store);
    setShowCreateModal(true);
  };

  // Submit Create or Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editStore) {
        await API.put(`/admin/stores/${editStore._id}`, form);
        showToast(`Medical Store "${form.storeName}" updated successfully ✅`);
      } else {
        await API.post("/admin/stores", form);
        showToast(`New Medical Store "${form.storeName}" created successfully ✅`);
      }
      setShowCreateModal(false);
      fetchStores();
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed", "error");
    }
  };

  // Filter Pipeline
  const filteredStores = stores.filter((s) => {
    if (statusFilter === "pending" && s.isApproved) return false;
    if (statusFilter === "approved" && !s.isApproved) return false;

    const term = searchFilter.toLowerCase().trim();
    if (term) {
      const matchName = s.storeName && s.storeName.toLowerCase().includes(term);
      const matchOwner = s.name && s.name.toLowerCase().includes(term);
      const matchCity = s.city && s.city.toLowerCase().includes(term);
      const matchEmail = s.email && s.email.toLowerCase().includes(term);
      const matchPhone = s.phone && s.phone.includes(term);
      if (!matchName && !matchOwner && !matchCity && !matchEmail && !matchPhone) return false;
    }

    return true;
  });

  const pendingList = stores.filter((s) => !s.isApproved);

  return (
    <div className="pt-24 min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-purple-400 uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Super Admin Control Panel
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
            <i className="fa-solid fa-shield-halved text-purple-400"></i>
            <span>Pharmacy Store Approval & Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Logged in as: <strong className="text-purple-300">{admin?.name} ({admin?.email})</strong></p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>Register New Medical Store</span>
          </button>

          <button
            onClick={() => {
              logoutAdmin();
              navigate("/admin/login");
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout Admin</span>
          </button>
        </div>
      </div>

      {/* Platform Multi-Theme Switcher Card */}
      <div className="glass-panel p-5 rounded-3xl border border-purple-500/30 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-palette text-purple-400 text-lg"></i>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Super Admin Multi-Theme Manager</h2>
          </div>
          <span className="text-xs text-purple-300 font-semibold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Active: <strong className="text-white capitalize">{themes.find((t) => t.id === theme)?.name}</strong>
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {themes.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  changeTheme(t.id);
                  showToast(`Switched theme to "${t.name}" ✅`);
                }}
                className={`p-3.5 rounded-2xl text-left border transition-all relative overflow-hidden group ${
                  isSelected
                    ? "border-purple-400 bg-purple-950/40 ring-2 ring-purple-500/50 shadow-lg"
                    : "border-slate-800 bg-slate-900/80 hover:border-purple-500/40 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${t.previewColor}`}></span>
                    <span className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors">
                      {t.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-extrabold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/40">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{t.description}</p>
              </button>
            );
          })}
        </div>
      </div>


      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`glass-panel p-5 rounded-2xl border text-left space-y-1 transition-all ${
            statusFilter === "all" ? "border-purple-500 bg-purple-950/20" : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="text-xs text-slate-400 uppercase font-bold">Total Registered Shops</div>
          <div className="text-3xl font-extrabold text-white">{stats.totalStores}</div>
        </button>

        <button
          onClick={() => setStatusFilter("pending")}
          className={`glass-panel p-5 rounded-2xl border text-left space-y-1 transition-all ${
            statusFilter === "pending" ? "border-amber-500 bg-amber-950/40" : "border-amber-500/30 bg-amber-950/20 hover:border-amber-500/60"
          }`}
        >
          <div className="text-xs text-amber-300 uppercase font-bold flex items-center justify-between">
            <span>Pending Approvals</span>
            {stats.pendingStores > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{stats.pendingStores}</div>
        </button>

        <button
          onClick={() => setStatusFilter("approved")}
          className={`glass-panel p-5 rounded-2xl border text-left space-y-1 transition-all ${
            statusFilter === "approved" ? "border-emerald-500 bg-emerald-950/40" : "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/60"
          }`}
        >
          <div className="text-xs text-emerald-300 uppercase font-bold">Active Approved Shops</div>
          <div className="text-3xl font-extrabold text-emerald-400">{stats.approvedStores}</div>
        </button>
      </div>

      {/* Pending Approvals Queue Section */}
      {pendingList.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 bg-amber-950/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <i className="fa-solid fa-clock text-amber-400"></i>
              <span>Pending Shop Approval Queue ({pendingList.length})</span>
            </h2>
            <span className="text-xs text-amber-400 font-semibold">Action Required</span>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {pendingList.map((store) => (
              <div key={store._id} className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-sm">{store.storeName}</h3>
                  <div className="text-xs text-slate-400">Owner: {store.name} ({store.city})</div>
                  <div className="text-[11px] text-slate-500">Phone: {store.phone} | {store.email}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleApproval(store)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400 shadow transition-all flex items-center gap-1"
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>Approve Shop</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Medical Stores Directory */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 space-y-4 shadow-xl">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">All Registered Medical Stores ({filteredStores.length})</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Realtime Search Input */}
            <div className="relative w-full sm:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="text"
                placeholder="Search shop, owner, city..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
              />
              {searchFilter && (
                <button onClick={() => setSearchFilter("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  &times;
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "all" ? "bg-purple-500 text-slate-950" : "text-slate-400"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "pending" ? "bg-amber-500 text-slate-950" : "text-slate-400"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "approved" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                }`}
              >
                Approved
              </button>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-purple-400 rounded-full animate-spin mx-auto"></div>
            <p>Loading medical stores directory...</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 space-y-2">
            <i className="fa-solid fa-store-slash text-3xl text-slate-600"></i>
            <p>No medical stores found matching your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Medical Store & Owner</th>
                  <th className="py-3.5 px-3">City & Address</th>
                  <th className="py-3.5 px-3">Phone & Email</th>
                  <th className="py-3.5 px-3 text-center">Medicines</th>
                  <th className="py-3.5 px-3 text-center">Approval Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStores.map((store) => (
                  <tr key={store._id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Store Name & Owner */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-white text-sm flex items-center gap-2">
                        <i className="fa-solid fa-house-medical text-teal-400"></i>
                        <span>{store.storeName}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Owner: <strong className="text-slate-300">{store.name}</strong>
                      </div>
                    </td>

                    {/* City & Address */}
                    <td className="py-3.5 px-3 text-slate-300">
                      <div className="font-bold text-teal-300">{store.city}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{store.address}</div>
                    </td>

                    {/* Phone & Email */}
                    <td className="py-3.5 px-3 text-slate-300">
                      <div>📞 {store.phone}</div>
                      <div className="text-[11px] text-slate-400">{store.email}</div>
                    </td>

                    {/* Medicines Count */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-teal-300 font-bold">
                        {store.medicineCount} item{store.medicineCount !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Approval Status Toggle Pill */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleApproval(store)}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all border ${
                          store.isApproved
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse"
                        }`}
                        title="Click to toggle approval status"
                      >
                        {store.isApproved ? "✓ Approved" : "⚠️ Pending Approval"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(store)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1"
                          title="Edit Store Details"
                        >
                          <i className="fa-solid fa-pen"></i>
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteStore(store)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1"
                          title="Delete Store"
                        >
                          <i className="fa-solid fa-trash"></i>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Medical Store */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 max-w-lg w-full space-y-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <i className={`fa-solid ${editStore ? "fa-pen-to-square text-amber-400" : "fa-plus-circle text-teal-400"}`}></i>
                <span>{editStore ? `Edit Medical Store: ${editStore.storeName}` : "Register New Medical Store"}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pharmacy / Store Name *</label>
                  <input
                    type="text"
                    required
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                    placeholder="e.g. City Life Medical"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                    placeholder="e.g. owner@store.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Password {editStore ? "(Leave blank to keep unchanged)" : "*"}
                  </label>
                  <input
                    type="password"
                    required={!editStore}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                    placeholder="e.g. 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                    placeholder="e.g. Delhi, Mumbai"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Store Address *</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                  placeholder="e.g. Shop 12, Main Market, Sector 15"
                />
              </div>

              {/* Approval Toggle Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isApproved}
                    onChange={(e) => setForm({ ...form, isApproved: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <span className="text-xs font-bold text-slate-300">
                  {form.isApproved ? "Approved (Visible in Search)" : "Pending Approval (Hidden)"}
                </span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
                >
                  {editStore ? "Save Store Changes" : "Create & Save Store"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;
