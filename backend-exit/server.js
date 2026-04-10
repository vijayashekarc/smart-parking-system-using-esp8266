require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios'); // <-- NEW: Added axios to talk to the ESP8266

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Exit DB Connected"))
  .catch(err => console.error("❌ Exit DB Error:", err));

// --- SHARED DATABASE MODELS ---
const userSchema = new mongoose.Schema({
  phone_no: String,
  unique_QRcodeID: String,
  name: String
});
const User = mongoose.model('User', userSchema);

const logSchema = new mongoose.Schema({
  phone_no: String,
  current_status: String,
  payment_status: { type: String, default: 'Pending' },
  Entry_datetime: Date,
  exit_datetime: Date
});
const ParkingLog = mongoose.model('ParkingLog', logSchema, 'parkinglogs'); 

// ==========================================
// --- EXIT VERIFICATION LOGIC ---
// ==========================================
app.post('/api/exit/verify', async (req, res) => {
  const { qr_data } = req.body;
  
  try {
    const user = await User.findOne({ unique_QRcodeID: qr_data });
    if (!user) return res.status(404).json({ success: false, message: "Unknown QR Code" });

    const latestLog = await ParkingLog.findOne({ phone_no: user.phone_no }).sort({ Entry_datetime: -1 });

    if (!latestLog) return res.status(400).json({ success: false, message: "No parking history found." });

    if (latestLog.current_status === 'Active') {
      return res.status(400).json({ success: false, message: "Car is still parked! Drive out of the slot first." });
    }

    if (latestLog.payment_status === 'Pending') {
      return res.status(402).json({ success: false, message: `Payment of ₹${latestLog.bill_amount} is Pending!` });
    }

    // --- NEW: BACKEND TRIGGERS THE GATE ---
    if (latestLog.payment_status === 'Paid') {
      const espUrl = process.env.ESP_IP;
      let gateMessage = "";

      try {
        if (espUrl) {
          // Tell the ESP8266 to open the gate (timeout quickly so the scanner doesn't lag)
          await axios.get(`${espUrl}/api/servo?state=on`, { timeout: 2000 });
          console.log(`[HARDWARE] Gate opened for ${user.name}`);
          gateMessage = "Gate Opening!";
        } else {
          console.log("[HARDWARE] ESP_IP not configured.");
        }
      } catch (hwError) {
        console.error("[HARDWARE] Could not reach ESP8266 Gate:", hwError.message);
        gateMessage = "(Hardware Offline)";
      }

      return res.json({ success: true, message: `Payment Verified! ${gateMessage} Drive safely, ${user.name}.` });
    }gateMessage

    res.status(400).json({ success: false, message: "System Error. Invalid Log State." });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.listen(process.env.PORT || 7000, () => console.log(`🚪 Exit Microservice running on port ${process.env.PORT || 7000}`));