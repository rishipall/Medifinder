const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const consultRoutes = require("./routes/consultRoutes");
const adminRoutes = require("./routes/adminRoutes");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/consult", consultRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("MediFind API is running ✅");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected ✅");

    // Auto-seed default Super Admin if none exists or update password to secure test password
    try {
      const adminCount = await Admin.countDocuments();
      const securePassword = await bcrypt.hash("MediFind#Admin2026", 10);
      if (adminCount === 0) {
        await Admin.create({
          name: "Super Admin",
          email: "admin@medifind.com",
          password: securePassword,
          role: "superadmin",
        });
        console.log("Created Default Super Admin Account: admin@medifind.com / MediFind#Admin2026 ✅");
      } else {
        await Admin.findOneAndUpdate(
          { email: "admin@medifind.com" },
          { password: securePassword }
        );
      }
    } catch (adminErr) {
      console.warn("Super Admin seed check notice:", adminErr.message);
    }

  })
  .catch((err) => {
    console.error("MongoDB connection failed ❌", err.message);
  });


