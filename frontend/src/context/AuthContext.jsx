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

export const AuthProvider = ({ children }) => {
  const [vendor, setVendor] = useState(getStoredVendor);
  const [admin, setAdmin] = useState(getStoredAdmin);

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

  return (
    <AuthContext.Provider value={{ vendor, login, logout, admin, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

