require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const ParkingLog = require('./models/ParkingLog');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// --- 1. IN-MEMORY PARKING LOT STATE ---
// Pure software state. No hardware to interfere!
let parkingSlots = [
  { id: 'A1', occupied: false, parked_by: null },
  { id: 'A2', occupied: false, parked_by: null },
  { id: 'B1', occupied: false, parked_by: null },
  { id: 'B2', occupied: false, parked_by: null }
];

// --- 2. AUTHENTICATION ---
app.post('/api/signup', async (req, res) => {
  try {
    const { name, phone_no, email_id, password, vehicle_name, vehicle_plate_no, vehicle_type } = req.body;
    
    // Generate a unique QR ID (e.g., phone + timestamp)
    const unique_QRcodeID = `QR_${phone_no}_${Date.now()}`;
    
    const newUser = new User({
      name, phone_no, email_id, password, vehicle_name, vehicle_plate_no, vehicle_type, unique_QRcodeID
    });
    
    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch(err) {
    res.status(400).json({ success: false, message: "User already exists or missing data" });
  }
});

app.post('/api/login', async (req, res) => {
  const { phone_no, password } = req.body;
  const user = await User.findOne({ phone_no, password });
  if (user) res.json({ success: true, user });
  else res.status(401).json({ success: false, message: "Invalid credentials" });
});

// --- 3. FETCH LAYOUT ---
app.get('/api/layout', (req, res) => {
  res.json(parkingSlots);
});

// --- 4. FAKE "PARK NOW" (DEMO BUTTON) ---
// --- 4. FAKE "PARK NOW" (DEMO BUTTON) ---
app.post('/api/park', async (req, res) => {
  const { phone_no, slot_id } = req.body;

  try {
    // 🛑 NEW RULE: Check if the user already has an active parking session
    const existingSession = await ParkingLog.findOne({ phone_no, current_status: 'Active' });
    if (existingSession) {
      return res.status(400).json({ success: false, message: "You already have a vehicle parked! Please leave your current slot first." });
    }

    // Find the slot to make sure it exists and is empty
    const slotIndex = parkingSlots.findIndex(s => s.id === slot_id);
    if (slotIndex === -1 || parkingSlots[slotIndex].occupied) {
      return res.status(400).json({ success: false, message: "Slot unavailable" });
    }

    // 1. Mark slot as occupied in memory
    parkingSlots[slotIndex].occupied = true;
    parkingSlots[slotIndex].parked_by = phone_no;

    // 2. Create Active Log in DB
    const newLog = new ParkingLog({ phone_no, slot_id, current_status: 'Active' });
    await newLog.save();

    res.json({ success: true, message: `Parked successfully in ${slot_id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to park" });
  }
});

// --- 5. FAKE "LEAVE" (DEMO BUTTON) ---
app.post('/api/leave', async (req, res) => {
  const { phone_no, slot_id } = req.body;

  const slotIndex = parkingSlots.findIndex(s => s.id === slot_id);
  
  try {
    // 1. Free the slot in memory
    if (slotIndex !== -1) {
      parkingSlots[slotIndex].occupied = false;
      parkingSlots[slotIndex].parked_by = null;
    }

    // 2. Find the Active log and Complete it
    const activeLog = await ParkingLog.findOne({ phone_no, slot_id, current_status: 'Active' });
    if (activeLog) {
      activeLog.current_status = 'Completed';
      activeLog.exit_datetime = new Date();
      
      // Calculate fake bill (e.g., ₹10 base + ₹2 per minute)
      const diffMs = activeLog.exit_datetime - activeLog.Entry_datetime;
      const minutes = Math.ceil(diffMs / 60000);
      activeLog.bill_amount = 10 + (minutes * 2);

      await activeLog.save();
    }

    res.json({ success: true, message: `Left ${slot_id}. Bill generated.` });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to leave" });
  }
});

// --- 6. FETCH USER LOGS ---
app.get('/api/logs/:phone_no', async (req, res) => {
  try {
    const logs = await ParkingLog.find({ phone_no: req.params.phone_no }).sort({ Entry_datetime: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// --- 7. FAKE PAYMENT GATEWAY ---
app.post('/api/pay', async (req, res) => {
  const { log_id, phone_no } = req.body;

  try {
    const log = await ParkingLog.findById(log_id);
    const user = await User.findOne({ phone_no });

    if (!log || !user) return res.status(404).json({ success: false, message: "Not found" });
    if (user.wallet_balance < log.bill_amount) return res.status(402).json({ success: false, message: "Insufficient funds" });

    // Deduct money and mark paid
    user.wallet_balance -= log.bill_amount;
    await user.save();

    log.payment_status = 'Paid';
    await log.save();

    res.json({ success: true, message: "Payment Successful", new_balance: user.wallet_balance });
  } catch (err) {
    res.status(500).json({ success: false, error: "Payment failed" });
  }
});


// ==========================================
// --- 8. ADMIN DASHBOARD APIs ---
// ==========================================
// Get ALL logs from ALL users (with Vehicle Data)
// Get global statistics (Revenue, Users, Active Sessions)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeParkings = await ParkingLog.countDocuments({ current_status: 'Active' });
    
    // Calculate total revenue from all paid logs
    const paidLogs = await ParkingLog.find({ payment_status: 'Paid' });
    const totalRevenue = paidLogs.reduce((sum, log) => sum + (log.bill_amount || 0), 0);
    
    res.json({ totalUsers, activeParkings, totalRevenue });
  } catch(err) { 
    res.status(500).json({ error: "Failed to fetch admin stats" }); 
  }
});

app.get('/api/admin/logs', async (req, res) => {
  try {
    // 1. Fetch all logs and users using .lean() for faster processing
    const logs = await ParkingLog.find().sort({ Entry_datetime: -1 }).lean();
    const users = await User.find().lean();
    
    // 2. Create a fast lookup dictionary for users based on phone_no
    const userDict = {};
    users.forEach(user => {
      userDict[user.phone_no] = {
        name: user.name,
        vehicle_name: user.vehicle_name,
        vehicle_plate_no: user.vehicle_plate_no
      };
    });

    // 3. Combine the data
    const combinedLogs = logs.map(log => {
      const userInfo = userDict[log.phone_no] || { 
        name: 'Unknown User', 
        vehicle_name: 'Unknown', 
        vehicle_plate_no: 'Unknown' 
      };
      
      return {
        ...log, // Keep all existing log data (status, bill, times)
        user_name: userInfo.name,
        vehicle_name: userInfo.vehicle_name,
        vehicle_plate_no: userInfo.vehicle_plate_no
      };
    });

    res.json(combinedLogs);
  } catch(err) { 
    console.error(err);
    res.status(500).json({ error: "Failed to fetch all logs" }); 
  }
});
app.listen(process.env.PORT, () => console.log(`🚀 Customer Backend on port ${process.env.PORT}`));