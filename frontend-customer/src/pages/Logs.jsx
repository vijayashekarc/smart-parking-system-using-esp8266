import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Logs() {
  const [logs, setLogs] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/logs/${user.phone_no}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePay = async (log_id) => {
    try {
      const res = await axios.post('http://localhost:5000/api/pay', { log_id, phone_no: user.phone_no });
      
      // Update local storage with new wallet balance
      const updatedUser = { ...user, wallet_balance: res.data.new_balance };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      alert(`✅ Payment Successful! New Balance: ₹${res.data.new_balance}`);
      fetchLogs(); // Refresh table
    } catch (err) {
      alert(err.response?.data?.message || "Payment Failed");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#ecf0f1', minHeight: '100vh' }}>
      <Link to="/dashboard" style={{ display: 'block', marginBottom: '20px' }}>← Back to Dashboard</Link>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', maxWidth: '900px', margin: '0 auto' }}>
        <h2>📜 Parking History</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#2c3e50', color: 'white' }}>
              <th style={{ padding: '10px' }}>Date</th>
              <th>Slot</th>
              <th>Status</th>
              <th>Bill</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{new Date(log.Entry_datetime).toLocaleString()}</td>
                <td>{log.slot_id}</td>
                <td>
                  {log.current_status === 'Active' ? '🚗 Active' : `✅ ${log.current_status}`}
                </td>
                <td>₹{log.bill_amount}</td>
                <td>
                  {log.current_status === 'Active' ? (
                    <span style={{ color: '#7f8c8d' }}>Ongoing...</span>
                  ) : log.payment_status === 'Paid' ? (
                    <span style={{ color: '#27ae60', fontWeight: 'bold' }}>PAID</span>
                  ) : (
                    <button onClick={() => handlePay(log._id)} style={{ background: '#e67e22', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                      💳 Pay ₹{log.bill_amount}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Logs;