require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const User = require('./models/User');
const ParkingLog = require('./models/ParkingLog');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ==========================================
// --- 1. IN-MEMORY PARKING LOT STATE ---
// ==========================================
let parkingSlots = [
  { id: 'A1', occupied: false, reserved: false, parked_by: null },
  { id: 'A2', occupied: false, reserved: false, parked_by: null },
  { id: 'B1', occupied: false, reserved: false, parked_by: null },
  { id: 'B2', occupied: false, reserved: false, parked_by: null }
];

// ==========================================
// --- 2. AUTHENTICATION ---
// ==========================================
app.post('/api/signup', async (req, res) => {
  try {
    const { name, phone_no, email_id, password, vehicle_name, vehicle_plate_no, vehicle_type } = req.body;
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

// ==========================================
// --- 3. FETCH LAYOUT ---
// ==========================================
app.get('/api/layout', (req, res) => {
  res.json(parkingSlots);
});

// ==========================================
// --- 4. RESERVATION SYSTEM ---
// ==========================================
app.post('/api/reserve', async (req, res) => {
  const { phone_no } = req.body;

  try {
    const existingSession = await ParkingLog.findOne({ phone_no, current_status: 'Active' });
    if (existingSession) return res.status(400).json({ success: false, message: "You already have a vehicle parked!" });

    const existingRes = parkingSlots.find(s => s.parked_by === phone_no);
    if (existingRes) return res.status(400).json({ success: false, message: "You already have a reserved slot!" });

    const nearestSlot = parkingSlots.find(s => !s.occupied && !s.reserved);
    if (!nearestSlot) return res.status(400).json({ success: false, message: "Parking Lot is Full!" });

    nearestSlot.reserved = true;
    nearestSlot.parked_by = phone_no;

    res.json({ success: true, message: `Slot ${nearestSlot.id} reserved! Please drive in.` });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to reserve" });
  }
});

app.post('/api/cancel-reservation', (req, res) => {
  const { phone_no } = req.body;
  const slot = parkingSlots.find(s => s.parked_by === phone_no && s.reserved && !s.occupied);
  
  if (slot) {
    slot.reserved = false;
    slot.parked_by = null;
    res.json({ success: true, message: "Reservation cancelled." });
  } else {
    res.status(400).json({ success: false, message: "No active reservation found." });
  }
});

// ==========================================
// --- 5. CORE PHYSICAL SENSOR LOGIC ---
// ==========================================
// We define this globally so both the Hardware Loop AND the UI Simulation buttons can trigger it!
const handlePhysicalSlot = async (slot_id, isPhysicallyOccupied) => {
  const slot = parkingSlots.find(s => s.id === slot_id);
  if (!slot) return;

  // SCENARIO A: CAR ARRIVES (Sensor goes Free -> Occupied)
  if (isPhysicallyOccupied && !slot.occupied) {
    slot.occupied = true;
    
    if (slot.reserved) {
      slot.reserved = false; 
      console.log(`[SENSOR] ${slot.parked_by} arrived at reserved slot ${slot_id}`);
      const newLog = new ParkingLog({ phone_no: slot.parked_by, slot_id, current_status: 'Active' });
      await newLog.save();
    } else {
      console.log(`[SENSOR] Guest arrived at ${slot_id}`);
      slot.parked_by = "Guest";
    }
  }

  // SCENARIO B: CAR DEPARTS (Sensor goes Occupied -> Free)
  if (!isPhysicallyOccupied && slot.occupied) {
    console.log(`[SENSOR] Car departed ${slot_id}. Auto-closing session...`);
    const phone_no = slot.parked_by;
    
    slot.occupied = false;
    slot.reserved = false;
    slot.parked_by = null;

    if (phone_no && phone_no !== "Guest") {
      const activeLog = await ParkingLog.findOne({ phone_no, slot_id, current_status: 'Active' });
      if (activeLog) {
        activeLog.current_status = 'Completed';
        activeLog.exit_datetime = new Date();
        
        const diffMs = activeLog.exit_datetime - activeLog.Entry_datetime;
        const minutes = Math.ceil(diffMs / 60000);
        activeLog.bill_amount = 10 + (minutes * 2);

        await activeLog.save();
        console.log(`✅ [BILLING] Bill generated for ${phone_no}: ₹${activeLog.bill_amount}`);
      }
    }
  }
};

// ==========================================
// --- 6. MANUAL SIMULATION ROUTES ---
// ==========================================
app.post('/api/simulate-arrival', async (req, res) => {
  await handlePhysicalSlot(req.body.slot_id, true);
  res.json({ success: true });
});

app.post('/api/simulate-departure', async (req, res) => {
  await handlePhysicalSlot(req.body.slot_id, false);
  res.json({ success: true });
});

// ==========================================
// --- 7. HARDWARE INTEGRATION LOOP ---
// ==========================================
let lastHardwareState = { A1: false, A2: false };

setInterval(async () => {
  try {
    const espUrl = process.env.ESP_IP;
    if (!espUrl) {
        console.log("⚠️ [HARDWARE] ESP_IP is missing from your .env file!");
        return; 
    }

    const res = await axios.get(`${espUrl}/api/status`, { timeout: 1500 });
    const currentA1 = (String(res.data.slot1_occupied) === "true");
    const currentA2 = (String(res.data.slot2_occupied) === "true");

    console.log(`📡 [LIVE SENSORS] A1: ${currentA1 ? '🚗 BUSY' : '🟩 FREE'} | A2: ${currentA2 ? '🚗 BUSY' : '🟩 FREE'}`);

    if (currentA1 !== lastHardwareState.A1) {
      await handlePhysicalSlot('A1', currentA1);
      lastHardwareState.A1 = currentA1;
    }

    if (currentA2 !== lastHardwareState.A2) {
      await handlePhysicalSlot('A2', currentA2);
      lastHardwareState.A2 = currentA2;
    }
  } catch (err) {
    console.log(`🔌 [HARDWARE OFFLINE] Searching for ESP8266 at ${process.env.ESP_IP}...`);
  }
}, 2000);

// ==========================================
// --- 8. LOGS & FAKE PAYMENT GATEWAY ---
// ==========================================
app.get('/api/logs/:phone_no', async (req, res) => {
  try {
    const logs = await ParkingLog.find({ phone_no: req.params.phone_no }).sort({ Entry_datetime: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

app.post('/api/pay', async (req, res) => {
  const { log_id, phone_no } = req.body;
  try {
    const log = await ParkingLog.findById(log_id);
    const user = await User.findOne({ phone_no });

    if (!log || !user) return res.status(404).json({ success: false, message: "Not found" });
    if (user.wallet_balance < log.bill_amount) return res.status(402).json({ success: false, message: "Insufficient funds" });

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
// --- 9. ADMIN DASHBOARD APIs ---
// ==========================================
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeParkings = await ParkingLog.countDocuments({ current_status: 'Active' });
    const paidLogs = await ParkingLog.find({ payment_status: 'Paid' });
    const totalRevenue = paidLogs.reduce((sum, log) => sum + (log.bill_amount || 0), 0);
    
    res.json({ totalUsers, activeParkings, totalRevenue });
  } catch(err) { 
    res.status(500).json({ error: "Failed to fetch admin stats" }); 
  }
});

app.get('/api/admin/logs', async (req, res) => {
  try {
    const logs = await ParkingLog.find().sort({ Entry_datetime: -1 }).lean();
    const users = await User.find().lean();
    
    const userDict = {};
    users.forEach(user => {
      userDict[user.phone_no] = {
        name: user.name,
        vehicle_name: user.vehicle_name,
        vehicle_plate_no: user.vehicle_plate_no
      };
    });

    const combinedLogs = logs.map(log => {
      const userInfo = userDict[log.phone_no] || { name: 'Unknown User', vehicle_name: 'Unknown', vehicle_plate_no: 'Unknown' };
      return {
        ...log,
        user_name: userInfo.name,
        vehicle_name: userInfo.vehicle_name,
        vehicle_plate_no: userInfo.vehicle_plate_no
      };
    });

    res.json(combinedLogs);
  } catch(err) { 
    res.status(500).json({ error: "Failed to fetch all logs" }); 
  }
});

// ==========================================
// --- START SERVER ---
// ==========================================
app.listen(process.env.PORT, () => console.log(`🚀 Customer Backend on port ${process.env.PORT}`));