require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Add the Middleware Here (After Express Initialization)
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// ========================
// 🚀 MongoDB Connection
// ========================
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// ========================
// 🛡️ User Authentication Schema
// ========================
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// ========================
// 🔥 Production Schema
// ========================
const departmentSchema = {
  ondate_prod: { type: Number, default: 0 },
  ondate_hands: { type: Number, default: 0 },
};

const ProductionSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Date in YYYY-MM-DD format
  MIXING: departmentSchema,
  BR_CDG: departmentSchema,
  PREDRG: departmentSchema,
  LH15: departmentSchema,
  COMBER: departmentSchema,
  DRG: departmentSchema,
  SMX: departmentSchema,
  SPG: departmentSchema,
  ACWDG: departmentSchema,
  PACKBAGS: departmentSchema,
});

const Production = mongoose.model("Production", ProductionSchema);

// ========================
// ⚡ Electrical Schema
// ========================
const sectionSchema = {
  type: { type: String, required: true },
  date: { type: String, required: true },
  lifeInDays: { type: Number, default: 0 },
  lifeInMonths: { type: Number, default: 0 },
  nextSchedule: { type: String, default: "" }
};

const ElectricalSchema = new mongoose.Schema({
  date: { type: String, required: true },
  sections: {
    TOP_APRON: sectionSchema,
    MIDDLE_APRON: sectionSchema,
    BOTTOM_APRON: sectionSchema
  }
});

const Electrical = mongoose.model("Electrical", ElectricalSchema);


// ========================
// 🔑 Authentication Routes
// ========================

// User Signup
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already in use." });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();
    
    res.json({ success: true, message: "Signup successful!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && user.password === password) {
    res.json({ success: true, message: "Login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// ========================
// 📊 Production Routes
// ========================
// ========================
// 📊 Production Routes
// ========================

// Add Production Data Route
// Add or Update Production Data by Date
app.post("/add", async (req, res) => {
  const { date, ...departments } = req.body;

  try {
    let record = await Production.findOne({ date });

    if (record) {
      // Update existing departments correctly
      Object.keys(departments).forEach((dept) => {
        if (!record[dept]) {
          record[dept] = { ondate_prod: 0, ondate_hands: 0 };
        }
        record[dept].ondate_prod += departments[dept].ondate_prod || 0;
        record[dept].ondate_hands += departments[dept].ondate_hands || 0;
      });
      await record.save();
      res.json({ message: "Production data updated successfully" });
    } else {
      // Create new record
      const newRecord = new Production({ date, ...departments });
      await newRecord.save();
      res.json({ message: "Production data added successfully" });
    }
  } catch (error) {
    console.error("Error saving production data:", error);
    res.status(500).json({ message: "Failed to save data", error: error.message });
  }
});


// Get Production Data by Date
app.get("/production/selected-date/:date", async (req, res) => {
  const { date } = req.params;
  try {
    const productionData = await Production.findOne({ date });
    res.json(productionData || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET Cumulative Electrical Data by Date
app.get("/cumulative/:date", async (req, res) => {
  const { date } = req.params;

  try {
    const records = await Electrical.find({ date: { $lte: date } });  // Fetch all records up to the given date

    if (records.length === 0) {
      return res.json({});
    }

    const cumulativeData = sections.reduce((acc, section) => {
      acc[section] = {
        type: "",
        lifeInDays: 0,
        lifeInMonths: 0,
        nextSchedule: "",
      };

      records.forEach((record) => {
        if (record[section]) {
          acc[section].lifeInDays += record[section]?.lifeInDays || 0;
          acc[section].lifeInMonths += record[section]?.lifeInMonths || 0;
          acc[section].type = record[section]?.type || acc[section].type;
          acc[section].nextSchedule = record[section]?.nextSchedule || acc[section].nextSchedule;
        }
      });

      return acc;
    }, {});

    res.json(cumulativeData);
  } catch (error) {
    console.error("Error fetching cumulative data:", error);
    res.status(500).json({ error: error.message });
  }
});



// Get Cumulative Production Data by Month
app.get("/cumulative/production/:month", async (req, res) => {
  const { month } = req.params;
  try {
    const records = await Production.find({ date: { $regex: `^${month}` } });

    const cumulative = {
      MIXING: { prod: 0, hands: 0 },
      BR_CDG: { prod: 0, hands: 0 },
      PREDRG: { prod: 0, hands: 0 },
      LH15: { prod: 0, hands: 0 },
      COMBER: { prod: 0, hands: 0 },
      DRG: { prod: 0, hands: 0 },
      SMX: { prod: 0, hands: 0 },
      SPG: { prod: 0, hands: 0 },
      ACWDG: { prod: 0, hands: 0 },
      PACKBAGS: { prod: 0, hands: 0 },
    };

    records.forEach((record) => {
      Object.keys(cumulative).forEach((dept) => {
        if (record[dept]) {
          cumulative[dept].prod += record[dept].ondate_prod || 0;
          cumulative[dept].hands += record[dept].ondate_hands || 0;
        }
      });
    });

    res.json(cumulative);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/// ========================
// ⚡ Electrical Routes
// ========================
// ✅ Store Electrical Maintenance Data Properly
app.post("/add-electrical", async (req, res) => {
  try {
    const { date, sections } = req.body;

    // ✅ Validate incoming data
    if (!date || !sections || typeof sections !== "object") {
      return res.status(400).json({ message: "Invalid data format received." });
    }

    // ✅ Check if record already exists
    let record = await Electrical.findOne({ date });

    if (record) {
      // Update existing record
      Object.keys(sections).forEach((section) => {
        if (record.sections[section]) {
          record.sections[section] = { ...sections[section] };
        }
      });
      await record.save();
      res.status(200).json({ message: "Data updated successfully!" });
    } else {
      // Create new record
      const newRecord = new Electrical({
        date,
        sections
      });
      await newRecord.save();
      res.status(201).json({ message: "Data added successfully!" });
    }

  } catch (error) {
    console.error("❌ Error saving data:", error);
    res.status(500).json({ message: "Failed to save data.", error: error.message });
  }
});

// ✅ Get Electrical Maintenance Data by Date
// ✅ Get All Electrical Records (Updated)
app.get("/electrical-all", async (req, res) => {
  try {
    const records = await Electrical.find().sort({ date: -1 }); // Sorted by most recent first
    if (!records.length) {
      return res.status(404).json({ message: "No electrical records found." });
    }

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error("❌ Error fetching all electrical data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch electrical data.",
      error: error.message
    });
  }
});

// ✅ Get Cumulative Electrical Data
app.get("/cumulative/electrical/:date", async (req, res) => {
  const { date } = req.params;

  try {
    const records = await Electrical.find({ date: { $lte: date } });

    const cumulativeData = {
      TOP_APRON: { type: "", lifeInDays: 0, lifeInMonths: 0, nextSchedule: "" },
      MIDDLE_APRON: { type: "", lifeInDays: 0, lifeInMonths: 0, nextSchedule: "" },
      BOTTOM_APRON: { type: "", lifeInDays: 0, lifeInMonths: 0, nextSchedule: "" }
    };

    records.forEach((record) => {
      Object.keys(cumulativeData).forEach((section) => {
        const data = record.sections[section];
        if (data) {
          cumulativeData[section].lifeInDays += data.lifeInDays || 0;
          cumulativeData[section].lifeInMonths += data.lifeInMonths || 0;
          cumulativeData[section].nextSchedule = data.nextSchedule || cumulativeData[section].nextSchedule;
          cumulativeData[section].type = data.type || cumulativeData[section].type;
        }
      });
    });

    res.json(cumulativeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// ========================
// 🚀 Start the Server
// ========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
