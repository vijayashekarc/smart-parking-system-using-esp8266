import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

function Profile() {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) return <p>Please login first.</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', background: '#ecf0f1', minHeight: '100vh' }}>
      <Link to="/dashboard" style={{ display: 'block', marginBottom: '20px', textAlign: 'left' }}>← Back to Dashboard</Link>
      
      <div style={{ background: 'white', padding: '40px', borderRadius: '15px', maxWidth: '400px', margin: '0 auto', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h2>👤 My Profile</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Phone:</strong> {user.phone_no}</p>
        <p><strong>Vehicle:</strong> {user.vehicle_name} ({user.vehicle_plate_no})</p>
        <h3 style={{ color: '#27ae60' }}>Wallet Balance: ₹{user.wallet_balance}</h3>

        <hr style={{ margin: '20px 0' }} />
        
        <h3>🚪 Exit Gate QR Code</h3>
        <p style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Scan this at the exit kiosk to open the gate.</p>
        
        <div style={{ background: 'white', padding: '15px', display: 'inline-block', border: '2px solid #bdc3c7', borderRadius: '10px' }}>
          {/* This magically generates the QR code graphic! */}
          <QRCodeSVG value={user.unique_QRcodeID} size={150} />
        </div>
      </div>
    </div>
  );
}
export default Profile;