import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import StoreDetail from "./pages/StoreDetail";
import VendorLogin from "./pages/VendorLogin";
import VendorRegister from "./pages/VendorRegister";
import VendorDashboard from "./pages/VendorDashboard";
import VendorProfile from "./pages/VendorProfile";
import Consult from "./pages/Consult";
import About from "./pages/About";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/consult" element={<Consult />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/store/:id" element={<StoreDetail />} />
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorRegister />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/profile" element={<VendorProfile />} />
        <Route path="/admin/login" element={<SuperAdminLogin />} />
        <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
