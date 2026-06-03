const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

// Load environment variables strictly from backend/.env
dotenv.config({ path: path.join(__dirname, "../.env") });

const createAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD

  try {
    // 1. Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    // 2. Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists!`);
      process.exit(0);
    }

    // 3. Create new Admin user
    const admin = new User({
      name: "System Administrator",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isVerified: true, // Auto-verify admin email
    });

    await admin.save();
    console.log("\n================================================");
    console.log("✅ SUCCESS: Admin user created successfully!");
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log("================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR: Failed to create admin user:", error.message);
    process.exit(1);
  }
};

createAdmin();
