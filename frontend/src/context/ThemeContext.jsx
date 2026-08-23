import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/axios";

const ThemeContext = createContext();

export const THEMES = [
  {
    id: "classic",
    name: "MediFind Cyber Dark",
    description: "Original deep dark navy with teal & cyan accents",
    previewColor: "from-teal-500 to-cyan-500",
    bgClass: "bg-[#050811]",
    textClass: "text-teal-400",
    badge: "Classic",
  },
  {
    id: "pharmaglass",
    name: "PharmaGlass Bio-Futuristic",
    description: "Attached Demo Theme: Botanical Water Glow, Cyan/Emerald Bio-Glass & Mesh Blobs",
    previewColor: "from-cyan-400 via-teal-400 to-emerald-400",
    bgClass: "bg-[#030712]",
    textClass: "text-cyan-400",
    badge: "Demo Theme 🔥",
  },
  {
    id: "sunset-coral",
    name: "Sunset Coral Health",
    description: "Warm obsidian background with vibrant coral, orange, & warm amber glow",
    previewColor: "from-rose-500 via-orange-400 to-amber-500",
    bgClass: "bg-[#12080a]",
    textClass: "text-rose-400",
    badge: "Warm Glow",
  },
  {
    id: "oceanic-azure",
    name: "Oceanic Deep Azure",
    description: "Midnight ocean abyss with electric blue & aqua glass panels",
    previewColor: "from-blue-600 via-cyan-500 to-teal-400",
    bgClass: "bg-[#040e1a]",
    textClass: "text-cyan-300",
    badge: "Deep Blue",
  },
  {
    id: "royal-purple",
    name: "Royal Cyberpunk Purple",
    description: "Deep sapphire & vibrant neon purple/magenta glow",
    previewColor: "from-purple-500 via-pink-500 to-indigo-500",
    bgClass: "bg-[#0b071e]",
    textClass: "text-purple-400",
    badge: "Neon Cyber",
  },
  {
    id: "oled-stealth",
    name: "OLED Stealth Pure Black",
    description: "True AMOLED pitch black (#000000) with neon emerald laser accents",
    previewColor: "from-emerald-400 via-green-500 to-teal-400",
    bgClass: "bg-black",
    textClass: "text-emerald-400",
    badge: "AMOLED Dark",
  },
  {
    id: "emerald-light",
    name: "Emerald Mint Light Glass",
    description: "Clean, ultra-modern light mint glass with crisp dark slate typography",
    previewColor: "from-emerald-400 to-teal-600",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-600",
    badge: "Mint Light",
  },
  {
    id: "clinical-white",
    name: "Clinical Laboratory White",
    description: "High-contrast clinical white & blue glass for medical labs",
    previewColor: "from-blue-500 via-cyan-400 to-slate-200",
    bgClass: "bg-slate-50",
    textClass: "text-blue-600",
    badge: "Clinical Light",
  },
];

const getRandomTheme = () => {
  try {
    const randomIndex = Math.floor(Math.random() * THEMES.length);
    return THEMES[randomIndex].id;
  } catch (err) {
    return "pharmaglass";
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getRandomTheme);

  const changeTheme = async (newThemeId) => {
    if (THEMES.some((t) => t.id === newThemeId)) {
      setTheme(newThemeId);
      localStorage.setItem("medifind_theme", newThemeId);
      try {
        await API.post("/admin/theme", { theme: newThemeId });
      } catch (err) {
        console.warn("Global theme persistence notice:", err.message);
      }
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove old theme classes
    THEMES.forEach((t) => {
      root.classList.remove(`theme-${t.id}`);
    });
    // Add current theme class
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
