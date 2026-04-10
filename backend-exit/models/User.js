const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  phone_no: { type: String, unique: true }, // Using phone_no as the main identifier
  email_id: String,
  password: String,
  vehicle_name: String,
  vehicle_plate_no: String,
  vehicle_type: { type: String, enum: ['2 wheeler', '4 wheeler'] },
  unique_QRcodeID: String,
  wallet_balance: { type: Number, default: 500 } // For our fake payment gateway
});

module.exports = mongoose.model('User', UserSchema);