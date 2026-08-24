const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medifind";

const MasterMedicine = require("../models/MasterMedicine");
const StoreInventory = require("../models/StoreInventory");

const migrate = async () => {
  try {
    console.log("Connecting to MongoDB for database normalization migration...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: "medicines" }).toArray();

    if (collections.length === 0) {
      console.log("No legacy 'medicines' collection found. Migration not needed.");
      await mongoose.disconnect();
      process.exit(0);
    }

    const legacyMedicines = await db.collection("medicines").find({}).toArray();
    console.log(`Found ${legacyMedicines.length} legacy medicine documents.`);

    let catalogCreated = 0;
    let inventoryCreated = 0;

    for (const item of legacyMedicines) {
      const normName = (item.name || "").toLowerCase().trim();
      if (!normName || !item.vendorId) continue;

      const normCompany = (item.companyName || "Generic / Unspecified").trim();
      const normDosage = (item.dosageMg || "").trim();

      // Find or create MasterMedicine catalog entry
      let masterMed = await MasterMedicine.findOne({
        name: normName,
        companyName: normCompany,
        dosageMg: normDosage,
      });

      if (!masterMed) {
        masterMed = await MasterMedicine.create({
          name: normName,
          brandName: item.name || "",
          companyName: normCompany,
          dosageMg: normDosage,
          packSize: (item.packSize || "1 Unit").trim(),
          category: item.category || "other",
          composition: (item.composition || "").trim(),
          mrp: parseFloat(item.mrp) || parseFloat(item.price) || 0,
          requiresPrescription: Boolean(item.requiresPrescription),
        });
        catalogCreated++;
      }

      // Create StoreInventory entry
      const numPrice = parseFloat(item.price) || 0;
      const numStock = parseInt(item.stockQuantity);
      const isStock = !isNaN(numStock) ? numStock > 0 : (item.inStock !== undefined ? item.inStock : true);

      await StoreInventory.findOneAndUpdate(
        { vendorId: item.vendorId, medicineId: masterMed._id },
        {
          vendorId: item.vendorId,
          medicineId: masterMed._id,
          price: numPrice,
          stockQuantity: !isNaN(numStock) ? numStock : 10,
          inStock: isStock,
          batchNumber: (item.batchNumber || "").trim(),
          expiryDate: (item.expiryDate || "").trim(),
        },
        { upsert: true, new: true }
      );

      inventoryCreated++;
    }

    console.log(`✅ Migration Complete!`);
    console.log(`- Master Catalog entries created: ${catalogCreated}`);
    console.log(`- Store Inventory items migrated: ${inventoryCreated}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrate();
