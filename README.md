# 💊 MediFind — Medicine Search Application

A full-stack MERN application to search medicines at nearby medical stores.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file (copy from `.env.example`):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/medifind
JWT_SECRET=medifind_super_secret_key
```
Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Open in browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 📁 Project Structure
```
MediFind/
├── backend/
│   ├── controllers/   ← Business logic
│   ├── middleware/    ← JWT auth check
│   ├── models/        ← MongoDB schemas
│   ├── routes/        ← API routes
│   └── server.js      ← Entry point
└── frontend/
    └── src/
        ├── api/       ← Axios instance
        ├── components/← Navbar
        ├── context/   ← Auth state
        ├── pages/     ← All pages
        └── utils/     ← Distance formula
```

---

## ✅ Optimizations Applied

| # | Optimization | Where |
|---|---|---|
| 1 | MongoDB filters medicines by name + inStock before sending | `medicineController.js` |
| 2 | `.lean()` used for read queries (faster plain JS objects) | `medicineController.js` |
| 3 | `.select()` used to return only needed fields | All controllers |
| 4 | Text index on medicine name for fast search | `Medicine.js` model |
| 5 | Compound index on vendorId for store queries | `Medicine.js` model |
| 6 | `Promise.all()` for parallel API calls on store detail page | `StoreDetail.jsx` |
| 7 | City filter support on backend (optional query param) | `medicineController.js` |
| 8 | Distance sorting stays on frontend (no DB needed) | `SearchResults.jsx` |

---

## 🔌 API Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | /api/auth/register | No | Vendor register |
| POST | /api/auth/login | No | Vendor login |
| GET | /api/medicines/search?name=X | No | Search medicines |
| GET | /api/medicines/store/:id | No | Store medicines |
| POST | /api/medicines | Yes | Add medicine |
| PUT | /api/medicines/:id | Yes | Edit medicine |
| DELETE | /api/medicines/:id | Yes | Delete medicine |
| GET | /api/vendors/:id | No | Get store info |
| PUT | /api/vendors/profile | Yes | Update profile |

---

## 🛠 Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- **Frontend**: React, Vite, React Router, Axios, Leaflet.js, Tailwind CSS
