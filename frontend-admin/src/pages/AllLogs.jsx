import { useState, useEffect } from 'react';
import axios from 'axios';

function AllLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
    // Auto-refresh the logs every 5 seconds so the admin sees cars entering/leaving live!
    const interval = setInterval(fetchLogs, 5000); 
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 style={{ color: '#2c3e50', margin: '0 0 20px 0' }}>Master Parking Logs</h1>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#34495e', color: 'white' }}>
              <th style={{ padding: '12px' }}>User Details</th>
              <th>Vehicle Info</th> {/* NEW COLUMN */}
              <th>Slot</th>
              <th>Status</th>
              <th>Entry Time</th>
              <th>Exit Time</th>
              <th>Bill</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '15px', textAlign: 'center' }}>No logs found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  
                  {/* User Details Column */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{log.user_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{log.phone_no}</div>
                  </td>

                  {/* NEW: Vehicle Info Column */}
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#e67e22', letterSpacing: '1px' }}>
                      {log.vehicle_plate_no}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                      {log.vehicle_name}
                    </div>
                  </td>

                  <td style={{ color: '#2980b9', fontWeight: 'bold' }}>{log.slot_id}</td>
                  
                  <td>
                    {log.current_status === 'Active' ? '🚗 Active' : `✅ ${log.current_status}`}
                  </td>
                  
                  <td style={{ fontSize: '0.9rem' }}>{new Date(log.Entry_datetime).toLocaleString()}</td>
                  <td style={{ fontSize: '0.9rem' }}>{log.exit_datetime ? new Date(log.exit_datetime).toLocaleString() : '--'}</td>
                  
                  <td style={{ fontWeight: 'bold' }}>₹{log.bill_amount}</td>
                  
                  <td>
                    {log.payment_status === 'Paid' ? (
                      <span style={{ color: '#27ae60', fontWeight: 'bold', background: '#e8f8f5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>PAID</span>
                    ) : (
                      <span style={{ color: '#e74c3c', fontWeight: 'bold', background: '#fdedec', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>PENDING</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AllLogs;