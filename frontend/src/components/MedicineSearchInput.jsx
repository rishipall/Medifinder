import { useState, useRef, useEffect } from "react";
import API from "../api/axios";

const MedicineSearchInput = ({
  initialTags = [],
  onSearch,
  placeholder = "Type medicine name or upload prescription photo...",
  className = ""
}) => {
  const [tags, setTags] = useState(() => {
    if (Array.isArray(initialTags)) return initialTags.filter(Boolean);
    if (typeof initialTags === "string" && initialTags.trim()) {
      return initialTags.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  });

  const [inputVal, setInputVal] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [uploadedPreviews, setUploadedPreviews] = useState([]);
  const [ocrError, setOcrError] = useState("");

  // Live Web Camera State & Refs
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // 'environment' | 'user'
  const [camError, setCamError] = useState("");
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync initialTags prop changes cleanly without wiping local tag additions

  useEffect(() => {
    let propTags = [];
    if (Array.isArray(initialTags)) {
      propTags = initialTags.filter(Boolean);
    } else if (typeof initialTags === "string" && initialTags.trim()) {
      propTags = initialTags.split(",").map((s) => s.trim()).filter(Boolean);
    }
    
    // Only update if propTags differ from current tags state
    const currentStr = tags.join(",").toLowerCase();
    const propStr = propTags.join(",").toLowerCase();
    if (propStr !== currentStr && propTags.length > 0) {
      setTags(propTags);
    }
  }, [initialTags]);

  // Handle Tag Addition
  const addTag = (text, autoSubmit = true) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newItems = trimmed.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    
    const updatedTags = [...tags];
    newItems.forEach((item) => {
      if (!updatedTags.some((t) => t.toLowerCase() === item.toLowerCase())) {
        updatedTags.push(item);
      }
    });

    setTags(updatedTags);
    setInputVal("");

    if (autoSubmit && onSearch && updatedTags.length > 0) {
      onSearch(updatedTags);
    }
  };

  const removeTag = (indexToRemove) => {
    const updatedTags = tags.filter((_, idx) => idx !== indexToRemove);
    setTags(updatedTags);
    if (onSearch) {
      onSearch(updatedTags);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };


  // Start Web Camera Stream
  const startCamera = async (mode = facingMode) => {
    setCamError("");
    stopCameraStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCamError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser."
          : "Unable to access camera on this device. Try uploading an image file instead."
      );
    }
  };

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const openCameraModal = () => {
    setShowCameraModal(true);
    startCamera(facingMode);
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setShowCameraModal(false);
    setCamError("");
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Helper to resize base64 or file image to max 1280px dimension at 0.8 JPEG quality
  const compressImage = (imageSource) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const MAX_SIZE = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      img.onerror = () => {
        resolve(typeof imageSource === "string" ? imageSource : "");
      };

      if (typeof imageSource === "string") {
        img.src = imageSource;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.readAsDataURL(imageSource);
      }
    });
  };

  // Capture Photo from Camera
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    closeCameraModal();

    const compressed = await compressImage(rawDataUrl);
    processImagesWithGemini([compressed]);
  };

  // Handle File Input Selection
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const compressPromises = files.map((file) => compressImage(file));
    const base64Images = await Promise.all(compressPromises);
    const validImages = base64Images.filter(Boolean);

    processImagesWithGemini(validImages);

    // Reset input
    e.target.value = "";
  };


  // Process Images via Backend Gemini OCR
  const processImagesWithGemini = async (base64Images) => {
    if (!base64Images || base64Images.length === 0) return;

    setIsScanning(true);
    setOcrError("");
    setScanMessage("Reading Doctor's Handwriting & Medicine Packaging with Gemini AI...");
    setUploadedPreviews(base64Images.slice(0, 3));

    try {
      const { data } = await API.post("/medicines/extract-from-images", {
        images: base64Images
      });

      if (data.success && Array.isArray(data.medicines) && data.medicines.length > 0) {
        const extracted = data.medicines;
        const updatedTags = [...tags];
        extracted.forEach((item) => {
          if (!updatedTags.some((t) => t.toLowerCase() === item.toLowerCase())) {
            updatedTags.push(item);
          }
        });

        setTags(updatedTags);

        setScanMessage(`🎉 Gemini found ${extracted.length} medicine(s): ${extracted.join(", ")}. Instantly searching medical stores...`);

        // 🚀 INSTANT AUTO SEARCH: Trigger store search immediately!
        setTimeout(() => {
          setIsScanning(false);
          setUploadedPreviews([]);
          if (onSearch && updatedTags.length > 0) {
            onSearch(updatedTags);
          }
        }, 1200);


      } else {
        setOcrError("No clear medicine names detected in the image. Please type the name or upload a clearer photo.");
        setTimeout(() => {
          setIsScanning(false);
          setUploadedPreviews([]);
        }, 3000);
      }
    } catch (err) {
      console.error("Gemini Vision OCR Error:", err);
      setOcrError(err.response?.data?.message || "Failed to analyze image with Gemini AI. Please try again.");
      setTimeout(() => {
        setIsScanning(false);
        setUploadedPreviews([]);
      }, 3000);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    let currentTags = [...tags];
    if (inputVal.trim()) {
      const trimmed = inputVal.trim();
      if (!currentTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        currentTags.push(trimmed);
        setTags(currentTags);
        setInputVal("");
      }
    }
    if (onSearch) {
      onSearch(currentTags);
    }
  };


  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Main Glass Search Input Bar */}
      <form onSubmit={handleSubmit} className="glass-panel p-2.5 sm:p-3.5 rounded-3xl border border-slate-700/80 shadow-2xl space-y-3">
        
        {/* Chips Container + Input Line */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2.5 sm:p-3 rounded-2xl border border-slate-700/80 min-h-[56px] focus-within:border-teal-400 transition-all shadow-inner">
          
          <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm ml-2 mr-1"></i>

          {/* Active Tags */}
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold animate-fadeIn"
            >
              <i className="fa-solid fa-capsules text-teal-400 text-[11px]"></i>
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="w-4 h-4 rounded-full bg-teal-500/30 hover:bg-rose-500/80 hover:text-white text-teal-300 text-[10px] flex items-center justify-center transition-all ml-1"
                title="Remove medicine"
              >
                &times;
              </button>
            </span>
          ))}

          {/* Text Input */}
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : "Add another medicine..."}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none min-w-[180px] px-2 py-1"
          />

          {/* Add Tag Button (if typing) */}
          {inputVal.trim() && (
            <button
              type="button"
              onClick={() => addTag(inputVal)}
              className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold hover:bg-teal-500/30 transition-all"
            >
              + Add Tag
            </button>
          )}

        </div>

        {/* Action Controls Toolbar: Camera, File Upload, Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Camera Button */}
            <button
              type="button"
              onClick={openCameraModal}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 hover:text-teal-200 text-xs font-bold transition-all flex items-center gap-2 group shadow-md"
            >
              <i className="fa-solid fa-camera text-teal-400 group-hover:scale-110 transition-transform"></i>
              <span>Scan Prescription Camera</span>
            </button>

            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all flex items-center gap-2 group shadow-md"
            >
              <i className="fa-solid fa-file-arrow-up text-cyan-400 group-hover:scale-110 transition-transform"></i>
              <span>Upload File / Wrapper</span>
            </button>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="px-7 py-3 rounded-2xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Search Stores ({tags.length > 0 ? `${tags.length} Medicine${tags.length > 1 ? "s" : ""}` : "All"})</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>

        </div>
      </form>

      {/* Demo / Quick Pill Suggestions */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 px-1 pt-1">
        <span className="font-semibold text-slate-500">Popular Quick Tags:</span>
        {["Paracetamol", "Amoxicillin", "Cetirizine", "Crocin", "Pantoprazole", "Dispirin"].map((med) => (
          <button
            key={med}
            type="button"
            onClick={() => addTag(med)}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 text-[11px] transition-all"
          >
            + {med}
          </button>
        ))}
      </div>

      {/* 📷 LIVE CAMERA SCANNER MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-700/80 overflow-hidden shadow-2xl relative space-y-4 p-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <i className="fa-solid fa-camera"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Prescription Camera Scanner</h3>
                  <p className="text-[11px] text-slate-400">Position doctor note or medicine box inside frame</p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCameraModal}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-500/80 text-slate-300 hover:text-white flex items-center justify-center transition-all"
              >
                &times;
              </button>
            </div>

            {/* Camera Video Viewfinder */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {camError ? (
                <div className="p-6 text-center space-y-3">
                  <i className="fa-solid fa-triangle-exclamation text-3xl text-rose-400"></i>
                  <p className="text-xs text-rose-300">{camError}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Scanning Grid overlay */}
                  <div className="absolute inset-4 border-2 border-dashed border-teal-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] text-teal-300 font-mono bg-slate-950/80 px-3 py-1 rounded-full border border-teal-500/40">
                      ALIGN PRESCRIPTION OR PACKAGING
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Controls Row */}
            {!camError && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:text-white transition-all flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-arrows-rotate"></i>
                  <span>Switch Camera ({facingMode === "environment" ? "Back" : "Front"})</span>
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <i className="fa-solid fa-circle-dot text-rose-600 animate-pulse"></i>
                  <span>Snap Photo & Extract</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 🔮 GEMINI VISION OCR SCANNING OVERLAY */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border border-teal-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Animated Laser Beam Banner */}
            <div className="w-20 h-20 rounded-3xl bg-teal-500/20 border-2 border-teal-400 text-teal-300 flex items-center justify-center text-4xl mx-auto relative overflow-hidden">
              <i className="fa-solid fa-wand-magic-sparkles animate-pulse"></i>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-400/40 to-transparent animate-scan"></div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-extrabold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                Gemini 2.5 AI Multimodal OCR
              </div>
              <h3 className="text-lg font-extrabold text-white">Analyzing Prescription Image</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">{scanMessage}</p>
            </div>

            {/* Upload Previews */}
            {uploadedPreviews.length > 0 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {uploadedPreviews.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Prescription preview"
                    className="w-16 h-16 rounded-xl object-cover border border-teal-500/50 shadow-md"
                  />
                ))}
              </div>
            )}

            {ocrError && (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {ocrError}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default MedicineSearchInput;
