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
  .then(() => console.log("✅ Exit Backend Connected to Master DB"))
  .catch(err => console.error("❌ DB Error:", err));

// --- API: VERIFY EXIT QR CODE ---
app.post('/api/exit/verify', async (req, res) => {
  const { qr_data } = req.body;
  
  console.log(`\n--- 🔍 SCAN RECEIVED ---`);
  console.log(`Raw QR Data: "${qr_data}"`);

  try {
    // 1. Clean the QR code string of any invisible spaces
    const cleanQR = qr_data ? qr_data.trim() : "";

    // 2. Find User
    const user = await User.findOne({ unique_QRcodeID: cleanQR });
    
    if (!user) {
      console.log(`❌ FAILED: Could not find user with QR: ${cleanQR}`);
      return res.status(404).json({ success: false, message: "Invalid QR Code. User not found." });
    }
    
    console.log(`✅ User Identified: ${user.name} (${user.phone_no})`);

    // 3. Find Latest Log
    const latestLog = await ParkingLog.findOne({ phone_no: user.phone_no }).sort({ Entry_datetime: -1 });

    if (!latestLog) {
      console.log(`❌ FAILED: ${user.name} has no parking history.`);
      return res.status(400).json({ success: false, message: "No parking history found for this user." });
    }

    console.log(`📋 Latest Log -> Status: ${latestLog.current_status} | Payment: ${latestLog.payment_status} | Bill: ₹${latestLog.bill_amount}`);

    // 4. Check Rules
    if (latestLog.payment_status === 'Paid') {
      console.log(`✅ SUCCESS: Gate Opening for ${user.name}!`);
      return res.json({ success: true, message: `Payment clear. Thank you, ${user.name}! Gate Opening...` });
      
    } else if (latestLog.current_status === 'Active') {
      console.log(`🛑 BLOCKED: ${user.name} is still marked as Active.`);
      return res.status(400).json({ success: false, message: "You are still marked as Parked! Please click 'Leave' on your dashboard first." });
      
    } else {
      console.log(`🛑 BLOCKED: ${user.name} owes ₹${latestLog.bill_amount}.`);
      return res.status(402).json({ success: false, message: `Access Denied! ₹${latestLog.bill_amount} is pending. Please pay on the app.` });
    }

  } catch (err) {
    console.error("❌ CRITICAL SERVER ERROR:", err);
    res.status(500).json({ success: false, message: "Server error during verification." });
  }
});

app.listen(process.env.PORT, () => console.log(`🚪 Exit Backend running on port ${process.env.PORT}`));