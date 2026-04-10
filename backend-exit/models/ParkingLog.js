const mongoose = require('mongoose');

const ParkingLogSchema = new mongoose.Schema({
  phone_no: String, // Links to User
  slot_id: String,
  current_status: { type: String, enum: ['Active', 'Cancelled', 'Completed'], default: 'Active' },
  Entry_datetime: { type: Date, default: Date.now },
  exit_datetime: Date,
  bill_amount: { type: Number, default: 0 },
  payment_status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
});

module.exports = mongoose.model('ParkingLog', ParkingLogSchema);