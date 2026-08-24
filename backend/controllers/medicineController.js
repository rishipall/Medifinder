const https = require("https");
const MasterMedicine = require("../models/MasterMedicine");
const StoreInventory = require("../models/StoreInventory");

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

// Helper function to format inventory item to match legacy medicine output shape
const formatInventoryItem = (inv) => {
  const catalog = inv.medicineId && typeof inv.medicineId === "object" ? inv.medicineId : {};
  return {
    _id: inv._id,
    medicineCatalogId: catalog._id || null,
    name: catalog.name || catalog.brandName || "",
    brandName: catalog.brandName || catalog.name || "",
    companyName: catalog.companyName || "Generic / Unspecified",
    dosageMg: catalog.dosageMg || "",
    packSize: catalog.packSize || "1 Unit",
    category: catalog.category || "other",
    composition: catalog.composition || "",
    mrp: catalog.mrp !== undefined ? catalog.mrp : (inv.price || 0),
    requiresPrescription: Boolean(catalog.requiresPrescription),
    price: inv.price,
    stockQuantity: inv.stockQuantity,
    inStock: inv.inStock,
    expiryDate: inv.expiryDate || "",
    batchNumber: inv.batchNumber || "",
    vendorId: inv.vendorId,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
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
      for (const [hindi, eng] of Object.entries(HINDI_MEDICINE_MAP)) {
        if (name.includes(hindi)) return eng;
      }
      return name;
    });

    // Build regex queries to search MasterMedicine catalog
    const catalogQueries = [];
    searchNames.forEach((origName, idx) => {
      const normName = normalizedSearchNames[idx];
      catalogQueries.push({ name: { $regex: origName, $options: "i" } });
      catalogQueries.push({ brandName: { $regex: origName, $options: "i" } });
      if (normName !== origName) {
        catalogQueries.push({ name: { $regex: normName, $options: "i" } });
        catalogQueries.push({ brandName: { $regex: normName, $options: "i" } });
      }
    });

    const masterMatches = await MasterMedicine.find({ $or: catalogQueries }).lean();
    const masterIds = masterMatches.map((m) => m._id);

    if (masterIds.length === 0) {
      return res.status(200).json({
        success: true,
        requestedMedicines: searchNames,
        totalStoresFound: 0,
        stores: []
      });
    }

    const vendorFilter = {
      isApproved: { $ne: false },
      ...(city && city.trim() !== "" ? { city: { $regex: city.trim(), $options: "i" } } : {}),
    };

    const inventoryItems = await StoreInventory.find({
      medicineId: { $in: masterIds },
      inStock: true
    })
      .populate("medicineId")
      .populate({
        path: "vendorId",
        select: "storeName phone address city lat lng",
        match: vendorFilter
      })
      .lean();

    const validItems = inventoryItems.filter((item) => item.vendorId && item.vendorId._id && item.medicineId);

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasUserCoords = !isNaN(userLat) && !isNaN(userLng);

    // Group matching inventory items by store (vendorId)
    const storesMap = {};

    validItems.forEach((inv) => {
      const vendor = inv.vendorId;
      const storeId = vendor._id.toString();
      const formattedMed = formatInventoryItem(inv);

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

      // Check which searchNames match this medicine catalog item
      searchNames.forEach((reqName) => {
        const medName = formattedMed.name.toLowerCase();
        const rName = reqName.toLowerCase();
        if (medName.includes(rName) || rName.includes(medName)) {
          storesMap[storeId].matchedRequestedNames.add(reqName);
        }
      });

      const existing = storesMap[storeId].matchedItems.find((i) => i._id.toString() === formattedMed._id.toString());
      if (!existing) {
        storesMap[storeId].matchedItems.push(formattedMed);
        storesMap[storeId].totalPrice += formattedMed.price || 0;
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

    // Sort: full match first, higher count, shortest distance, lowest price
    storeList.sort((a, b) => {
      if (a.isFullMatch !== b.isFullMatch) return b.isFullMatch ? 1 : -1;
      if (a.availableCount !== b.availableCount) return b.availableCount - a.availableCount;
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

// 🔍 Single Medicine Search
const searchMedicines = async (req, res) => {
  const { name, city, lat, lng, limit } = req.query;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Please enter a medicine name to search ❌" });
  }

  try {
    const normName = name.trim();
    const masterMatches = await MasterMedicine.find({
      $or: [
        { name: { $regex: normName, $options: "i" } },
        { brandName: { $regex: normName, $options: "i" } },
        { composition: { $regex: normName, $options: "i" } },
      ]
    }).lean();

    const masterIds = masterMatches.map((m) => m._id);

    if (masterIds.length === 0) {
      return res.status(200).json([]);
    }

    const vendorFilter = {
      isApproved: { $ne: false },
      ...(city && city.trim() !== "" ? { city: { $regex: city.trim(), $options: "i" } } : {}),
    };

    let inventoryItems = await StoreInventory.find({
      medicineId: { $in: masterIds },
      inStock: true
    })
      .populate("medicineId")
      .populate({
        path: "vendorId",
        select: "storeName phone address city lat lng",
        match: vendorFilter,
      })
      .lean();

    // Filter out unmatched vendor items
    inventoryItems = inventoryItems.filter((i) => i.vendorId !== null && i.medicineId !== null);

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasUserCoords = !isNaN(userLat) && !isNaN(userLng);

    let result = inventoryItems.map((inv) => {
      const vendor = inv.vendorId || {};
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

      const formatted = formatInventoryItem(inv);
      return { ...formatted, distance };
    });

    if (hasUserCoords) {
      result.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    const maxLimit = parseInt(limit) || 5;
    result = result.slice(0, maxLimit);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Get all medicines by a specific store (for store detail & vendor dashboard)
const getMedicinesByStore = async (req, res) => {
  try {
    const inventoryItems = await StoreInventory.find({ vendorId: req.params.vendorId })
      .populate("medicineId")
      .lean();

    const medicines = inventoryItems
      .filter((inv) => inv.medicineId)
      .map(formatInventoryItem);

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
    const normName = name.toLowerCase().trim();
    const normCompany = companyName ? companyName.trim() : "Generic / Unspecified";
    const normDosage = dosageMg ? dosageMg.trim() : "";

    // Step 1: Find or create in MasterMedicine catalog
    let masterMed = await MasterMedicine.findOne({
      name: normName,
      companyName: normCompany,
      dosageMg: normDosage,
    });

    const numPrice = parseFloat(price) || 0;
    const numMrp = parseFloat(mrp) || numPrice;

    if (!masterMed) {
      masterMed = await MasterMedicine.create({
        name: normName,
        brandName: name.trim(),
        companyName: normCompany,
        dosageMg: normDosage,
        packSize: packSize ? packSize.trim() : "1 Unit",
        category: category || "other",
        composition: composition ? composition.trim() : "",
        mrp: numMrp,
        requiresPrescription: Boolean(requiresPrescription),
      });
    }

    const numStock = parseInt(stockQuantity);
    const calculatedInStock = !isNaN(numStock) ? numStock > 0 : (inStock !== undefined ? inStock : true);

    // Step 2: Create or update vendor store inventory
    const inventory = await StoreInventory.findOneAndUpdate(
      { vendorId: req.vendor.id, medicineId: masterMed._id },
      {
        vendorId: req.vendor.id,
        medicineId: masterMed._id,
        price: numPrice,
        stockQuantity: !isNaN(numStock) ? numStock : 10,
        inStock: calculatedInStock,
        expiryDate: expiryDate ? expiryDate.trim() : "",
        batchNumber: batchNumber ? batchNumber.trim() : "",
      },
      { upsert: true, new: true }
    ).populate("medicineId");

    const formattedItem = formatInventoryItem(inventory);

    res.status(201).json({ message: "Medicine added to store inventory ✅", medicine: formattedItem });
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Update medicine — vendor only, own store inventory only
const updateMedicine = async (req, res) => {
  try {
    const inventory = await StoreInventory.findOne({ _id: req.params.id, vendorId: req.vendor.id });
    if (!inventory) return res.status(404).json({ message: "Medicine item not found or unauthorized ❌" });

    const updateData = { ...req.body };
    const stockUpdate = {};

    if (updateData.price !== undefined) stockUpdate.price = parseFloat(updateData.price);
    if (updateData.stockQuantity !== undefined) {
      const sq = parseInt(updateData.stockQuantity);
      stockUpdate.stockQuantity = isNaN(sq) ? 0 : sq;
      stockUpdate.inStock = stockUpdate.stockQuantity > 0;
    }
    if (updateData.inStock !== undefined) stockUpdate.inStock = Boolean(updateData.inStock);
    if (updateData.expiryDate !== undefined) stockUpdate.expiryDate = updateData.expiryDate.trim();
    if (updateData.batchNumber !== undefined) stockUpdate.batchNumber = updateData.batchNumber.trim();

    const updatedInv = await StoreInventory.findByIdAndUpdate(req.params.id, stockUpdate, { new: true }).populate("medicineId");

    // Optional catalog metadata update if requested
    if (updatedInv.medicineId) {
      const catalogUpdate = {};
      if (updateData.name) catalogUpdate.name = updateData.name.toLowerCase().trim();
      if (updateData.companyName) catalogUpdate.companyName = updateData.companyName.trim();
      if (updateData.dosageMg !== undefined) catalogUpdate.dosageMg = updateData.dosageMg.trim();
      if (updateData.packSize !== undefined) catalogUpdate.packSize = updateData.packSize.trim();
      if (updateData.category) catalogUpdate.category = updateData.category;
      if (updateData.composition !== undefined) catalogUpdate.composition = updateData.composition.trim();
      if (updateData.mrp !== undefined) catalogUpdate.mrp = parseFloat(updateData.mrp);
      if (updateData.requiresPrescription !== undefined) catalogUpdate.requiresPrescription = Boolean(updateData.requiresPrescription);

      if (Object.keys(catalogUpdate).length > 0) {
        await MasterMedicine.findByIdAndUpdate(updatedInv.medicineId._id, catalogUpdate);
      }
    }

    const finalInv = await StoreInventory.findById(req.params.id).populate("medicineId").lean();
    const formatted = formatInventoryItem(finalInv);

    res.status(200).json({ message: "Medicine inventory updated ✅", medicine: formatted });
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Delete medicine — vendor only, own inventory only
const deleteMedicine = async (req, res) => {
  try {
    const inventory = await StoreInventory.findOne({ _id: req.params.id, vendorId: req.vendor.id });
    if (!inventory) return res.status(404).json({ message: "Medicine inventory not found or unauthorized ❌" });

    await StoreInventory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Medicine inventory item removed ✅" });
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
