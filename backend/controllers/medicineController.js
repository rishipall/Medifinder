const https = require("https");
const Medicine = require("../models/Medicine");

// Dictionary for mapping common Hindi / Devanagari medicine terms to English
const HINDI_MEDICINE_MAP = {

  "पैरासिटामोल": "paracetamol",
  "पेरासिटामोल": "paracetamol",
  "क्रोसिन": "crocin",
  "डोलो": "dolo",
  "डोलो 650": "dolo 650",
  "अमोक्सिसिलिन": "amoxicillin",
  "एमोक्सिसिलिन": "amoxicillin",
  "सेटिरिज़िन": "cetirizine",
  "सेटीरिज़िन": "cetirizine",
  "डिस्पिरिन": "dispirin",
  "डिस्प्रीन": "dispirin",
  "पैंटोप्राजोल": "pantoprazole",
  "एजिथ्रोमाइसिन": "azithromycin",
  "अज़िथ्रोमाइसिन": "azithromycin",
  "मेटफॉर्मिन": "metformin"
};

// Helper function to call Gemini Vision API with automatic model fallback
const callGeminiVisionAPI = async (apiKey, imageParts) => {
  const modelsToTry = ["gemini-2.5-flash", "gemini-3.6-flash"];
  let lastError = null;

  const promptText = `You are an expert pharmaceutical AI OCR engine for MediFind.
Analyze the provided image(s) which contain handwritten doctor prescriptions, printed prescription notes, medicine box wrappers, blister foil strips, or bottle labels.
Extract all clear medicine names (both generic and brand names, e.g. Paracetamol, Amoxicillin, Cetirizine, Crocin, Pantoprazole, Dispirin, Augmentin, Azithromycin, Dolo 650, Metformin).

CRITICAL HINDI & MULTILINGUAL TRANSLATION REQUIREMENT:
- If any medicine name is written in Hindi script (Devanagari, e.g. "पैरासिटामोल", "अमोक्सिसिलिन", "क्रोसिन", "डोलो", "डिस्पिरिन") or in Hindi-English transliterated phonetics (e.g. "paracetamol ki goli", "bukhar ki dawa"), ALWAYS translate/convert it to its standard English chemical or brand name as stored in pharmacy databases (e.g. "Paracetamol", "Amoxicillin", "Crocin", "Dolo 650", "Dispirin").
- Do NOT output Devanagari Hindi characters in the JSON array; convert every medicine name into its standard English equivalent.

Ignore hospital headers, doctor signatures, patient names, dates, dosage frequency instructions (e.g. 1-0-1, 500mg, 10 days), or non-medicine notes.
Clean up the medicine names to their standard readable form.
Return STRICTLY JSON format matching this exact schema:
{
  "medicines": ["Standard English Name 1", "Standard English Name 2"]
}`;

  const parts = [{ text: promptText }, ...imageParts];

  for (const modelName of modelsToTry) {
    try {
      const result = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });

        const options = {
          hostname: "generativelanguage.googleapis.com",
          port: 443,
          path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                const textResponse = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textResponse) {
                  const jsonResult = JSON.parse(textResponse);
                  resolve(jsonResult);
                } else {
                  reject(new Error(`No candidate text in Gemini Vision response (${modelName})`));
                }
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`Gemini API [${modelName}] HTTP ${res.statusCode}: ${data}`));
            }
          });
        });

        req.on("error", (e) => reject(e));
        req.setTimeout(20000, () => {
          req.destroy();
          reject(new Error(`Gemini Vision request timed out (${modelName})`));
        });

        req.write(postData);
        req.end();
      });

      return result;
    } catch (err) {
      console.warn(`[Gemini Vision] Model ${modelName} attempt failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini Vision models failed.");
};


// 📷 Gemini Vision OCR: Extract medicine names from uploaded prescription or medicine wrapper images
const extractMedicinesFromImages = async (req, res) => {
  try {
    const { images } = req.body; // Array of base64 data URLs or base64 strings

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, message: "Please upload at least one image." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
      return res.status(400).json({
        success: false,
        message: "Gemini API Key is not configured on the server."
      });
    }

    // Format base64 image parts for Gemini API
    const imageParts = images.map((img) => {
      let mimeType = "image/jpeg";
      let base64Data = img;

      if (img.startsWith("data:")) {
        const matches = img.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      return {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      };
    });

    const result = await callGeminiVisionAPI(apiKey, imageParts);
    const extractedList = Array.isArray(result?.medicines) ? result.medicines : [];

    // Filter out duplicates and empty strings
    const uniqueMedicines = Array.from(
      new Set(
        extractedList
          .map((m) => typeof m === "string" ? m.trim() : "")
          .filter((m) => m.length > 1)
      )
    );

    return res.status(200).json({
      success: true,
      medicines: uniqueMedicines,
      rawCount: extractedList.length
    });
  } catch (err) {
    console.error("Error in extractMedicinesFromImages:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to extract medicine names from image using Gemini AI.",
      error: err.message
    });
  }
};

// 🔍 Multi-Medicine Search & Store Availability Engine
const searchMultipleMedicines = async (req, res) => {
  try {
    let namesInput = req.body.names || req.query.names || req.query.name;
    const city = req.body.city || req.query.city;
    const lat = req.body.lat || req.query.lat;
    const lng = req.body.lng || req.query.lng;
    const limit = req.body.limit || req.query.limit;

    let searchNames = [];
    if (Array.isArray(namesInput)) {
      searchNames = namesInput;
    } else if (typeof namesInput === "string") {
      searchNames = namesInput.split(",").map((s) => s.trim());
    }

    searchNames = Array.from(new Set(searchNames.map((n) => n.trim()).filter((n) => n.length > 0)));

    if (searchNames.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide at least one medicine name to search." });
    }

    // Convert Hindi Devanagari script terms to English if present
    const normalizedSearchNames = searchNames.map((name) => {
      if (HINDI_MEDICINE_MAP[name]) return HINDI_MEDICINE_MAP[name];
      // Check partial match in Hindi map
      for (const [hindi, eng] of Object.entries(HINDI_MEDICINE_MAP)) {
        if (name.includes(hindi)) return eng;
      }
      return name;
    });

    // Build regex filters for each requested medicine
    const regexQueries = [];
    searchNames.forEach((origName, idx) => {
      const normName = normalizedSearchNames[idx];
      regexQueries.push({ name: { $regex: origName, $options: "i" } });
      if (normName !== origName) {
        regexQueries.push({ name: { $regex: normName, $options: "i" } });
      }
    });

    const query = {
      $or: regexQueries,
      inStock: true
    };

    const vendorFilter = {
      isApproved: { $ne: false },
      ...(city && city.trim() !== "" ? { city: { $regex: city.trim(), $options: "i" } } : {}),
    };



    const medicines = await Medicine.find(query)
      .populate({
        path: "vendorId",
        select: "storeName phone address city lat lng",
        match: vendorFilter
      })
      .select("name companyName dosageMg packSize category price mrp stockQuantity inStock composition requiresPrescription expiryDate batchNumber vendorId")
      .lean();


    const validMedicines = medicines.filter((m) => m.vendorId && m.vendorId._id);

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasUserCoords = !isNaN(userLat) && !isNaN(userLng);

    // Group matching medicines by store (vendorId)
    const storesMap = {};

    validMedicines.forEach((med) => {
      const vendor = med.vendorId;
      const storeId = vendor._id.toString();

      if (!storesMap[storeId]) {
        let distance = null;
        const vLat = parseFloat(vendor.lat);
        const vLng = parseFloat(vendor.lng);

        if (hasUserCoords && !isNaN(vLat) && !isNaN(vLng) && (vLat !== 0 || vLng !== 0)) {
          const R = 6371; // km
          const dLat = ((vLat - userLat) * Math.PI) / 180;
          const dLng = ((vLng - userLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) *
              Math.cos((vLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = parseFloat((R * c).toFixed(1));
        }

        storesMap[storeId] = {
          vendor: {
            _id: vendor._id,
            storeName: vendor.storeName,
            phone: vendor.phone,
            address: vendor.address,
            city: vendor.city,
            lat: vendor.lat,
            lng: vendor.lng
          },
          distance,
          matchedItems: [],
          matchedRequestedNames: new Set(),
          totalPrice: 0
        };
      }

      // Check which of the searchNames matched this medicine
      searchNames.forEach((reqName) => {
        if (med.name.toLowerCase().includes(reqName.toLowerCase()) || reqName.toLowerCase().includes(med.name.toLowerCase())) {
          storesMap[storeId].matchedRequestedNames.add(reqName);
        }
      });

      // Add medicine item details if not already present
      const existing = storesMap[storeId].matchedItems.find((i) => i._id.toString() === med._id.toString());
      if (!existing) {
        storesMap[storeId].matchedItems.push(med);
        storesMap[storeId].totalPrice += med.price || 0;
      }
    });

    const storeList = Object.values(storesMap).map((store) => {
      const availableRequestedNames = Array.from(store.matchedRequestedNames);
      const missingMedicines = searchNames.filter(
        (reqName) => !availableRequestedNames.some((arr) => arr.toLowerCase() === reqName.toLowerCase())
      );
      const totalRequested = searchNames.length;
      const availableCount = availableRequestedNames.length;
      const isFullMatch = availableCount === totalRequested;
      const matchPercentage = Math.round((availableCount / totalRequested) * 100);

      return {
        vendor: store.vendor,
        distance: store.distance,
        matchedItems: store.matchedItems,
        availableRequestedNames,
        missingMedicines,
        totalRequested,
        availableCount,
        isFullMatch,
        matchPercentage,
        totalPrice: parseFloat(store.totalPrice.toFixed(2))
      };
    });

    // Sorting algorithm:
    // 1. Full matches first (100% available)
    // 2. Higher match percentage
    // 3. Shortest distance (if location provided)
    storeList.sort((a, b) => {
      if (a.isFullMatch !== b.isFullMatch) {
        return b.isFullMatch ? 1 : -1;
      }
      if (a.availableCount !== b.availableCount) {
        return b.availableCount - a.availableCount;
      }
      if (hasUserCoords) {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }
      return a.totalPrice - b.totalPrice;
    });

    const maxLimit = parseInt(limit) || 50;
    const finalStores = storeList.slice(0, maxLimit);

    return res.status(200).json({
      success: true,
      requestedMedicines: searchNames,
      totalStoresFound: finalStores.length,
      stores: finalStores
    });
  } catch (err) {
    console.error("Error in searchMultipleMedicines:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during multi-medicine search",
      error: err.message
    });
  }
};

// ✅ OPTIMIZED: Filter happens in MongoDB, not frontend
// Only matched + inStock medicines are returned
// Vendor details populated in same query (single DB round trip)
// Optional: city filter to reduce results further
const searchMedicines = async (req, res) => {
  const { name, city, lat, lng, limit } = req.query;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Please enter a medicine name to search ❌" });
  }

  try {
    const query = {
      name: { $regex: name.trim(), $options: "i" },
      inStock: true,
    };

    // Build vendor filter (only approved stores + optional city filter)
    const vendorFilter = {
      isApproved: { $ne: false },
      ...(city && city.trim() !== "" ? { city: { $regex: city.trim(), $options: "i" } } : {}),
    };


    // DB query: filter medicines + populate vendor in one shot
    let medicines = await Medicine.find(query)
      .populate({
        path: "vendorId",
        select: "storeName phone address city lat lng",
        match: vendorFilter,
      })
      .select("name category price inStock vendorId")
      .lean();

    // Remove medicines where vendor didn't match city filter
    medicines = medicines.filter((m) => m.vendorId !== null);

    // Backend Haversine Distance Calculation & Proximity Sorting
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasUserCoords = !isNaN(userLat) && !isNaN(userLng);

    medicines = medicines.map((m) => {
      const vendor = m.vendorId || {};
      const vLat = parseFloat(vendor.lat);
      const vLng = parseFloat(vendor.lng);
      let distance = null;

      if (hasUserCoords && !isNaN(vLat) && !isNaN(vLng) && (vLat !== 0 || vLng !== 0)) {
        const R = 6371; // Earth radius in km
        const dLat = ((vLat - userLat) * Math.PI) / 180;
        const dLng = ((vLng - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((vLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = parseFloat((R * c).toFixed(1));
      }
      return { ...m, distance };
    });

    // Sort ascending by distance if user coordinates provided
    if (hasUserCoords) {
      medicines.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    // Backend filtering: Limit to Top 5 nearest shops by default
    const maxLimit = parseInt(limit) || 5;
    medicines = medicines.slice(0, maxLimit);

    res.status(200).json(medicines);
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Get all medicines by a specific store (for store detail page)
const getMedicinesByStore = async (req, res) => {
  try {
    const medicines = await Medicine.find({ vendorId: req.params.vendorId })
      .select("name companyName dosageMg packSize category price mrp stockQuantity inStock composition requiresPrescription expiryDate batchNumber")
      .lean();
    res.status(200).json(medicines);
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Add medicine — vendor only
const addMedicine = async (req, res) => {
  const {
    name,
    companyName,
    dosageMg,
    packSize,
    category,
    price,
    mrp,
    stockQuantity,
    inStock,
    composition,
    requiresPrescription,
    expiryDate,
    batchNumber,
  } = req.body;

  try {
    const numPrice = parseFloat(price) || 0;
    const numMrp = parseFloat(mrp) || numPrice;
    const numStock = parseInt(stockQuantity);
    const calculatedInStock = !isNaN(numStock) ? numStock > 0 : (inStock !== undefined ? inStock : true);

    const medicine = await Medicine.create({
      name: name.toLowerCase().trim(),
      companyName: companyName ? companyName.trim() : "Generic / Unspecified",
      dosageMg: dosageMg ? dosageMg.trim() : "",
      packSize: packSize ? packSize.trim() : "1 Unit",
      category: category || "other",
      price: numPrice,
      mrp: numMrp,
      stockQuantity: !isNaN(numStock) ? numStock : 10,
      inStock: calculatedInStock,
      composition: composition ? composition.trim() : "",
      requiresPrescription: Boolean(requiresPrescription),
      expiryDate: expiryDate ? expiryDate.trim() : "",
      batchNumber: batchNumber ? batchNumber.trim() : "",
      vendorId: req.vendor.id,
    });

    res.status(201).json({ message: "Medicine added to store inventory ✅", medicine });
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Update medicine — vendor only, own medicines only
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, vendorId: req.vendor.id });
    if (!medicine) return res.status(404).json({ message: "Medicine not found or unauthorized ❌" });

    const updateData = { ...req.body };
    if (updateData.name) updateData.name = updateData.name.toLowerCase().trim();
    if (updateData.companyName) updateData.companyName = updateData.companyName.trim();
    if (updateData.dosageMg !== undefined) updateData.dosageMg = updateData.dosageMg.trim();
    if (updateData.packSize !== undefined) updateData.packSize = updateData.packSize.trim();
    if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price);
    if (updateData.mrp !== undefined) updateData.mrp = parseFloat(updateData.mrp);
    if (updateData.stockQuantity !== undefined) {
      const sq = parseInt(updateData.stockQuantity);
      updateData.stockQuantity = isNaN(sq) ? 0 : sq;
      updateData.inStock = updateData.stockQuantity > 0;
    }

    const updated = await Medicine.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json({ message: "Medicine updated ✅", medicine: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Delete medicine — vendor only, own medicines only
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, vendorId: req.vendor.id });
    if (!medicine) return res.status(404).json({ message: "Medicine not found or unauthorized ❌" });

    await Medicine.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Medicine deleted ✅" });
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

module.exports = {
  searchMedicines,
  searchMultipleMedicines,
  extractMedicinesFromImages,
  getMedicinesByStore,
  addMedicine,
  updateMedicine,
  deleteMedicine,
};


