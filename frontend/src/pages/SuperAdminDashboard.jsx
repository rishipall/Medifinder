import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const CATEGORY_OPTIONS = [
  "Clinic",
  "Hospital",
  "Big Hospital",
  "Semi Gov Hospital",
  "Gov Hospital",
  "Private Hospital",
  "Nursing Home",
];

const SuperAdminDashboard = () => {
  const { admin, logoutAdmin } = useAuth();
  const { theme, changeTheme, themes } = useTheme();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState("stores"); // 'stores' | 'doctors'

  // --- STORES STATE ---
  const [stats, setStats] = useState({ totalStores: 0, pendingStores: 0, approvedStores: 0 });
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({ text: "", type: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editStore, setEditStore] = useState(null);
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

  // --- DOCTORS STATE ---
  const [doctorStats, setDoctorStats] = useState({ totalDoctors: 0, pendingDoctors: 0, approvedDoctors: 0 });
  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorStatusFilter, setDoctorStatusFilter] = useState("all");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
    hospitalName: "",
    category: "Clinic",
    specialization: ["General Physician"],
    degree: "MBBS",
    isGeneralPhysician: false,
    address: "",
    city: "",
    lat: "0",
    lng: "0",
    gstNumber: "",
    clinicDetails: "",
    educationDetails: "",
    isApproved: true,
  });

  const getAdminHeaders = () => {
    const adminToken = localStorage.getItem("adminToken");
    return adminToken ? { headers: { Authorization: `Bearer ${adminToken}` } } : {};
  };

  useEffect(() => {
    if (!admin) {
      navigate("/admin/login");
    } else {
      fetchStores();
      fetchDoctors();
    }
  }, [admin, navigate]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/stores", getAdminHeaders());
      setStats(data.stats);
      setStores(data.stores);
    } catch (err) {
      console.error("Fetch stores error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    setDoctorLoading(true);
    try {
      const { data } = await API.get("/admin/doctors", getAdminHeaders());
      setDoctorStats(data.stats);
      setDoctors(data.doctors);
    } catch (err) {
      console.error("Fetch doctors error:", err);
    } finally {
      setDoctorLoading(false);
    }
  };

  const showToast = (text, type = "success") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: "", type: "" }), 3500);
  };

  // --- STORE ACTIONS ---
  const handleToggleApproval = async (store) => {
    const newStatus = !store.isApproved;
    try {
      await API.put(`/admin/stores/${store._id}/approve`, { isApproved: newStatus }, getAdminHeaders());
      showToast(`Store "${store.storeName}" is now ${newStatus ? "Approved ✅" : "Pending/Suspended ⚠️"}`);
      fetchStores();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update store status", "error");
    }
  };

  const handleDeleteStore = async (store) => {
    if (!window.confirm(`Are you sure you want to delete medical store "${store.storeName}"?`)) return;
    try {
      await API.delete(`/admin/stores/${store._id}`, getAdminHeaders());
      showToast(`Store "${store.storeName}" deleted successfully ✅`);
      fetchStores();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete store", "error");
    }
  };

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

  const openEditModal = (store) => {
    setForm({
      name: store.name || "",
      email: store.email || "",
      password: "",
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editStore) {
        await API.put(`/admin/stores/${editStore._id}`, form, getAdminHeaders());
        showToast(`Medical Store "${form.storeName}" updated successfully ✅`);
      } else {
        await API.post("/admin/stores", form, getAdminHeaders());
        showToast(`New Medical Store "${form.storeName}" created successfully ✅`);
      }
      setShowCreateModal(false);
      fetchStores();
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed", "error");
    }
  };

  // --- DOCTOR ACTIONS ---
  const handleToggleDoctorApproval = async (doc) => {
    const newStatus = !doc.isApproved;
    try {
      await API.put(`/admin/doctors/${doc._id}/approve`, { isApproved: newStatus }, getAdminHeaders());
      showToast(`Doctor "${doc.name}" (${doc.hospitalName}) is now ${newStatus ? "Approved ✅" : "Pending/Suspended ⚠️"}`);
      fetchDoctors();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update doctor status", "error");
    }
  };

  const handleDeleteDoctor = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete doctor profile for "${doc.name}"?`)) return;
    try {
      await API.delete(`/admin/doctors/${doc._id}`, getAdminHeaders());
      showToast(`Doctor "${doc.name}" deleted successfully ✅`);
      fetchDoctors();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete doctor", "error");
    }
  };

  const openCreateDoctorModal = () => {
    setDoctorForm({
      name: "",
      email: "",
      password: "Doctor#Pass2026",
      phone: "",
      whatsapp: "",
      hospitalName: "",
      category: "Clinic",
      specialization: ["General Physician"],
      degree: "MBBS",
      isGeneralPhysician: false,
      address: "",
      city: "",
      lat: "0",
      lng: "0",
      gstNumber: "",
      clinicDetails: "",
      educationDetails: "",
      isApproved: true,
    });
    setEditDoctor(null);
    setShowDoctorModal(true);
  };

  const openEditDoctorModal = (doc) => {
    setDoctorForm({
      name: doc.name || "",
      email: doc.email || "",
      password: "",
      phone: doc.phone || "",
      whatsapp: doc.whatsapp || "",
      hospitalName: doc.hospitalName || "",
      category: doc.category || "Clinic",
      specialization: doc.specialization || ["General Physician"],
      degree: doc.degree || "MBBS",
      isGeneralPhysician: Boolean(doc.isGeneralPhysician),
      address: doc.address || "",
      city: doc.city || "",
      lat: doc.lat !== undefined ? doc.lat.toString() : "0",
      lng: doc.lng !== undefined ? doc.lng.toString() : "0",
      gstNumber: doc.gstNumber || "",
      clinicDetails: doc.clinicDetails || "",
      educationDetails: doc.educationDetails || "",
      isApproved: doc.isApproved !== undefined ? Boolean(doc.isApproved) : true,
    });
    setEditDoctor(doc);
    setShowDoctorModal(true);
  };

  const handleDoctorFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editDoctor) {
        await API.put(`/admin/doctors/${editDoctor._id}`, doctorForm, getAdminHeaders());
        showToast(`Doctor profile "${doctorForm.name}" updated successfully ✅`);
      } else {
        await API.post("/admin/doctors", doctorForm, getAdminHeaders());
        showToast(`New Doctor profile "${doctorForm.name}" registered successfully ✅`);
      }
      setShowDoctorModal(false);
      fetchDoctors();
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed", "error");
    }
  };

  // Filters
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

  const filteredDoctors = doctors.filter((d) => {
    if (doctorStatusFilter === "pending" && d.isApproved) return false;
    if (doctorStatusFilter === "approved" && !d.isApproved) return false;
    const term = doctorSearch.toLowerCase().trim();
    if (term) {
      const matchName = d.name && d.name.toLowerCase().includes(term);
      const matchHosp = d.hospitalName && d.hospitalName.toLowerCase().includes(term);
      const matchCity = d.city && d.city.toLowerCase().includes(term);
      const matchEmail = d.email && d.email.toLowerCase().includes(term);
      const matchPhone = d.phone && d.phone.includes(term);
      const matchSpec = (d.specialization || []).some(s => s.toLowerCase().includes(term));
      if (!matchName && !matchHosp && !matchCity && !matchEmail && !matchPhone && !matchSpec) return false;
    }
    return true;
  });

  const pendingStoresList = stores.filter((s) => !s.isApproved);
  const pendingDoctorsList = doctors.filter((d) => !d.isApproved);

  // Validation Helper for Super Admin Modals
  const handleStoreInputChange = (field, value) => {
    let val = value;
    if (field === "name" && /\d/.test(val)) {
      val = val.replace(/\d/g, "");
      showToast("Numbers/Digits are not allowed in Owner Name field. ❌", "error");
    }
    if (field === "city" && /\d/.test(val)) {
      val = val.replace(/\d/g, "");
      showToast("Numbers/Digits are not allowed in City field. ❌", "error");
    }
    if (field === "phone" && /\D/.test(val)) {
      val = val.replace(/\D/g, "");
      showToast("Only numbers/digits are allowed in Phone field. ❌", "error");
    }
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleDoctorInputChange = (field, value) => {
    let val = value;
    if (field === "name" && /\d/.test(val)) {
      val = val.replace(/\d/g, "");
      showToast("Numbers/Digits are not allowed in Doctor Name field. ❌", "error");
    }
    if (field === "city" && /\d/.test(val)) {
      val = val.replace(/\d/g, "");
      showToast("Numbers/Digits are not allowed in City field. ❌", "error");
    }
    if ((field === "phone" || field === "whatsapp") && /\D/.test(val)) {
      val = val.replace(/\D/g, "");
      showToast(`Only numbers/digits are allowed in ${field === "phone" ? "Phone" : "WhatsApp"} field. ❌`, "error");
    }
    setDoctorForm((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="pt-24 min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Action Toast */}
      {actionMsg.text && (
        <div
          className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl text-xs font-extrabold shadow-2xl border flex items-center gap-2 animate-fadeIn ${
            actionMsg.type === "error" ? "bg-rose-950 text-rose-200 border-rose-500" : "bg-teal-950 text-teal-200 border-teal-500"
          }`}
        >
          <i className={`fa-solid ${actionMsg.type === "error" ? "fa-circle-xmark text-rose-400" : "fa-circle-check text-teal-400"}`}></i>
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-purple-400 uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Super Admin Control Panel
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
            <i className="fa-solid fa-shield-halved text-purple-400"></i>
            <span>MediFind Master Admin Portal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Logged in as: <strong className="text-purple-300">{admin?.name} ({admin?.email})</strong></p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "stores" ? (
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-plus-circle"></i>
              <span>Register New Medical Store</span>
            </button>
          ) : (
            <button
              onClick={openCreateDoctorModal}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-400 to-teal-400 text-slate-950 font-extrabold text-xs hover:brightness-110 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>Register New Doctor / Hospital</span>
            </button>
          )}

          <button
            onClick={() => {
              logoutAdmin();
              navigate("/admin/login");
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab("stores")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTab === "stores"
              ? "bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <i className="fa-solid fa-store text-sm"></i>
          <span>Medical Stores (Pharmacies)</span>
          {pendingStoresList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              {pendingStoresList.length} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("doctors")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTab === "doctors"
              ? "bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <i className="fa-solid fa-user-doctor text-sm"></i>
          <span>Doctors & Hospitals / Clinics</span>
          {pendingDoctorsList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              {pendingDoctorsList.length} Pending
            </span>
          )}
        </button>
      </div>

      {/* Multi-Theme Switcher Card */}
      <div className="glass-panel p-5 rounded-3xl border border-purple-500/30 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-palette text-purple-400 text-lg"></i>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Super Admin Multi-Theme Manager</h2>
          </div>
          <span className="text-xs text-purple-300 font-semibold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Active Theme: <strong className="text-white capitalize">{themes.find((t) => t.id === theme)?.name}</strong>
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
                className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden group ${
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

      {/* ================= TAB 1: MEDICAL STORES ================= */}
      {activeTab === "stores" && (
        <div className="space-y-8">
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
                {stats.pendingStores > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>}
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

          {/* Pending Stores Queue */}
          {pendingStoresList.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 bg-amber-950/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <i className="fa-solid fa-clock text-amber-400"></i>
                  <span>Pending Shop Approval Queue ({pendingStoresList.length})</span>
                </h2>
                <span className="text-xs text-amber-400 font-semibold">Action Required</span>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {pendingStoresList.map((store) => (
                  <div key={store._id} className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white text-sm">{store.storeName}</h3>
                      <div className="text-xs text-slate-400">Owner: {store.name} ({store.city})</div>
                      <div className="text-[11px] text-slate-500">Phone: {store.phone} | {store.email}</div>
                    </div>
                    <button
                      onClick={() => handleToggleApproval(store)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400 shadow transition-all flex items-center gap-1"
                    >
                      <i className="fa-solid fa-check"></i>
                      <span>Approve</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Directory Table for Stores */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white">Registered Medical Stores ({filteredStores.length})</h2>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search shop, owner, city..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
                />
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button onClick={() => setStatusFilter("all")} className={`px-3 py-1 rounded-lg text-xs font-bold ${statusFilter === "all" ? "bg-purple-500 text-slate-950" : "text-slate-400"}`}>All</button>
                  <button onClick={() => setStatusFilter("pending")} className={`px-3 py-1 rounded-lg text-xs font-bold ${statusFilter === "pending" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}>Pending</button>
                  <button onClick={() => setStatusFilter("approved")} className={`px-3 py-1 rounded-lg text-xs font-bold ${statusFilter === "approved" ? "bg-emerald-500 text-slate-950" : "text-slate-400"}`}>Approved</button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading stores...</div>
            ) : filteredStores.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No medical stores found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-bold text-[11px]">
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
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-white text-sm">{store.storeName}</div>
                          <div className="text-xs text-slate-400">Owner: {store.name}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          <div className="font-bold text-teal-300">{store.city}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{store.address}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          <div>📞 {store.phone}</div>
                          <div className="text-[11px] text-slate-400">{store.email}</div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-teal-300">{store.medicineCount || 0} items</td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleApproval(store)}
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                              store.isApproved ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            {store.isApproved ? "✓ Approved" : "⚠️ Pending"}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-2">
                          <button onClick={() => openEditModal(store)} className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">Edit</button>
                          <button onClick={() => handleDeleteStore(store)} className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: DOCTORS & HOSPITALS ================= */}
      {activeTab === "doctors" && (
        <div className="space-y-8">
          {/* KPI Counters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setDoctorStatusFilter("all")}
              className={`glass-panel p-5 rounded-2xl border text-left space-y-1 transition-all ${
                doctorStatusFilter === "all" ? "border-teal-400 bg-teal-950/20" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="text-xs text-slate-400 uppercase font-bold">Total Registered Doctors & Hospitals</div>
              <div className="text-3xl font-extrabold text-white">{doctorStats.totalDoctors}</div>
            </button>

            <button
              onClick={() => setDoctorStatusFilter("pending")}
              className={`glass-panel p-5 rounded-2xl border text-left space-y-1 transition-all ${
                doctorStatusFilter === "pending" ? "border-amber-500 bg-amber-950/40" : "border-amber-500/30 bg-amber-950/20 hover:border-amber-500/60"
              }`}
            >
              <div className="text-xs text-amber-300 uppercase font-bold flex items-center justify-between">
                <span>Pending Doctor Approvals</span>
                {doctorStats.pendingDoctors > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>}
              </div>
              <div className="text-3xl font-extrabold text-amber-400">{doctorStats.pendingDoctors}</div>
            </button>

            <button
              onClick={() => setDoctorStatusFilter("approved")}
              className={`glass-panel p-5 rounded-2xl border text-left space-y-1 transition-all ${
                doctorStatusFilter === "approved" ? "border-emerald-500 bg-emerald-950/40" : "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/60"
              }`}
            >
              <div className="text-xs text-emerald-300 uppercase font-bold">Active Approved Doctors</div>
              <div className="text-3xl font-extrabold text-emerald-400">{doctorStats.approvedDoctors}</div>
            </button>
          </div>

          {/* Pending Doctor Approval Queue */}
          {pendingDoctorsList.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 bg-amber-950/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <i className="fa-solid fa-user-clock text-amber-400"></i>
                  <span>Pending Doctor Approval Queue ({pendingDoctorsList.length})</span>
                </h2>
                <span className="text-xs text-amber-400 font-semibold">Action Required</span>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {pendingDoctorsList.map((doc) => (
                  <div key={doc._id} className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white text-sm">{doc.name}</h3>
                      <div className="text-xs text-teal-300">{doc.hospitalName} ({doc.category})</div>
                      <div className="text-[11px] text-slate-400">Degree: {doc.degree} | Specialization: {(doc.specialization || []).join(", ")}</div>
                      <div className="text-[11px] text-slate-500">Phone: {doc.phone} | {doc.email}</div>
                    </div>
                    <button
                      onClick={() => handleToggleDoctorApproval(doc)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400 shadow transition-all flex items-center gap-1"
                    >
                      <i className="fa-solid fa-check"></i>
                      <span>Approve</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Directory Table for Doctors */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white">Registered Doctors & Hospitals ({filteredDoctors.length})</h2>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search doctor, hospital, spec, city..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                />
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button onClick={() => setDoctorStatusFilter("all")} className={`px-3 py-1 rounded-lg text-xs font-bold ${doctorStatusFilter === "all" ? "bg-teal-400 text-slate-950" : "text-slate-400"}`}>All</button>
                  <button onClick={() => setDoctorStatusFilter("pending")} className={`px-3 py-1 rounded-lg text-xs font-bold ${doctorStatusFilter === "pending" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}>Pending</button>
                  <button onClick={() => setDoctorStatusFilter("approved")} className={`px-3 py-1 rounded-lg text-xs font-bold ${doctorStatusFilter === "approved" ? "bg-emerald-500 text-slate-950" : "text-slate-400"}`}>Approved</button>
                </div>
              </div>
            </div>

            {doctorLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading doctors directory...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No doctors or hospitals found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-bold text-[11px]">
                      <th className="py-3.5 px-4">Doctor & Degree</th>
                      <th className="py-3.5 px-3">Hospital / Clinic & Category</th>
                      <th className="py-3.5 px-3">Specialization & Type</th>
                      <th className="py-3.5 px-3">Call & WhatsApp</th>
                      <th className="py-3.5 px-3 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDoctors.map((doc) => (
                      <tr key={doc._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                            <i className="fa-solid fa-user-doctor text-teal-400"></i>
                            <span>{doc.name}</span>
                          </div>
                          <div className="text-xs text-teal-300 font-semibold">{doc.degree}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          <div className="font-bold text-white">{doc.hospitalName}</div>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">{doc.category}</span>
                          <div className="text-[11px] text-slate-400">{doc.city}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {(doc.specialization || []).map((spec, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">{spec}</span>
                            ))}
                            {doc.isGeneralPhysician && <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold">Physician</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          <div>📞 {doc.phone}</div>
                          {doc.whatsapp && <div className="text-[11px] text-emerald-400">💬 {doc.whatsapp}</div>}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleDoctorApproval(doc)}
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                              doc.isApproved ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            {doc.isApproved ? "✓ Approved" : "⚠️ Pending"}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-2">
                          <button onClick={() => openEditDoctorModal(doc)} className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">Edit</button>
                          <button onClick={() => handleDeleteDoctor(doc)} className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Store */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <i className={`fa-solid ${editStore ? "fa-pen-to-square text-amber-400" : "fa-plus-circle text-teal-400"}`}></i>
                <span>{editStore ? `Edit Store: ${editStore.storeName}` : "Register New Medical Store"}</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Store Name *</label>
                  <input type="text" required value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Owner Name *</label>
                  <input type="text" required value={form.name} onChange={(e) => handleStoreInputChange("name", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone *</label>
                  <input type="text" required value={form.phone} onChange={(e) => handleStoreInputChange("phone", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City *</label>
                  <input type="text" required value={form.city} onChange={(e) => handleStoreInputChange("city", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Address *</label>
                <input type="text" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" checked={form.isApproved} onChange={(e) => setForm({ ...form, isApproved: e.target.checked })} className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-300">{form.isApproved ? "Approved (Visible in Search)" : "Pending Approval"}</span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs">Save Store</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Doctor */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-teal-500/50 max-w-xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <i className={`fa-solid ${editDoctor ? "fa-user-pen text-amber-400" : "fa-user-plus text-teal-400"}`}></i>
                <span>{editDoctor ? `Edit Doctor Profile: ${editDoctor.name}` : "Register New Doctor / Hospital"}</span>
              </h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleDoctorFormSubmit} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Doctor Name *</label>
                  <input type="text" required value={doctorForm.name} onChange={(e) => handleDoctorInputChange("name", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                  <input type="email" required value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password {editDoctor ? "(Leave blank to keep)" : "*"}</label>
                  <input type="password" required={!editDoctor} value={doctorForm.password} onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hospital / Clinic Name *</label>
                  <input type="text" required value={doctorForm.hospitalName} onChange={(e) => setDoctorForm({ ...doctorForm, hospitalName: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select value={doctorForm.category} onChange={(e) => setDoctorForm({ ...doctorForm, category: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white">
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Degree / Qualification *</label>
                  <input type="text" required value={doctorForm.degree} onChange={(e) => setDoctorForm({ ...doctorForm, degree: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Call Phone *</label>
                  <input type="text" required value={doctorForm.phone} onChange={(e) => handleDoctorInputChange("phone", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp Phone</label>
                  <input type="text" value={doctorForm.whatsapp} onChange={(e) => handleDoctorInputChange("whatsapp", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City *</label>
                  <input type="text" required value={doctorForm.city} onChange={(e) => handleDoctorInputChange("city", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GSTIN / Reg No.</label>
                  <input type="text" value={doctorForm.gstNumber} onChange={(e) => setDoctorForm({ ...doctorForm, gstNumber: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Clinic Address *</label>
                <input type="text" required value={doctorForm.address} onChange={(e) => setDoctorForm({ ...doctorForm, address: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input type="checkbox" id="adminPhysician" checked={doctorForm.isGeneralPhysician} onChange={(e) => setDoctorForm({ ...doctorForm, isGeneralPhysician: e.target.checked })} className="w-4 h-4 accent-teal-400" />
                <label htmlFor="adminPhysician" className="text-xs font-bold text-teal-300">Is General Physician (Handles all general patient types)</label>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="adminDocApproved" checked={doctorForm.isApproved} onChange={(e) => setDoctorForm({ ...doctorForm, isApproved: e.target.checked })} className="w-4 h-4 accent-teal-400" />
                <label htmlFor="adminDocApproved" className="text-xs font-bold text-slate-300">{doctorForm.isApproved ? "Approved (Visible in AI Consult & Search)" : "Pending Approval"}</label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs">Save Doctor Profile</button>
                <button type="button" onClick={() => setShowDoctorModal(false)} className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
