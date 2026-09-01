import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const getStoredVendor = () => {
  try {
    const saved = localStorage.getItem("vendor");
    return saved && saved !== "undefined" ? JSON.parse(saved) : null;
  } catch (err) {
    return null;
  }
};

const getStoredAdmin = () => {
  try {
    const saved = localStorage.getItem("admin");
    return saved && saved !== "undefined" ? JSON.parse(saved) : null;
  } catch (err) {
    return null;
  }
};

const getStoredDoctor = () => {
  try {
    const saved = localStorage.getItem("doctor");
    return saved && saved !== "undefined" ? JSON.parse(saved) : null;
  } catch (err) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [vendor, setVendor] = useState(getStoredVendor);
  const [admin, setAdmin] = useState(getStoredAdmin);
  const [doctor, setDoctor] = useState(getStoredDoctor);

  const login = (vendorData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("vendor", JSON.stringify(vendorData));
    setVendor(vendorData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("vendor");
    setVendor(null);
  };

  const loginAdmin = (adminData, token) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("admin", JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setAdmin(null);
  };

  const loginDoctor = (doctorData, token) => {
    localStorage.setItem("doctorToken", token);
    localStorage.setItem("doctor", JSON.stringify(doctorData));
    setDoctor(doctorData);
  };

  const logoutDoctor = () => {
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("doctor");
    setDoctor(null);
  };

  return (
    <AuthContext.Provider value={{ vendor, login, logout, admin, loginAdmin, logoutAdmin, doctor, loginDoctor, logoutDoctor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


