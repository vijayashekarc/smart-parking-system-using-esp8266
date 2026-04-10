import { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, activeParkings: 0, totalRevenue: 0 });
  const [layout, setLayout] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Live updates every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const statsRes = await axios.get('http://localhost:5000/api/admin/stats');
      setStats(statsRes.data);

      const layoutRes = await axios.get('http://localhost:5000/api/layout');
      setLayout(layoutRes.data);
    } catch (err) {
      console.error("Error fetching admin data");
    }
  };

  // Helper to get slot data safely
  const getSlot = (id) => layout.find(s => s.id === id) || { id, occupied: false, parked_by: null };

  // Admin-specific SlotCard (No buttons, just shows status and the user's phone number)
  const SlotCard = ({ data }) => {
    const bg = data.occupied ? '#e74c3c' : '#2ecc71';
    
    return (
      <div style={{ ...styles.slot, background: bg }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>{data.id}</h2>
        <span style={{ fontSize: '0.8rem', letterSpacing: '1px', textAlign: 'center', padding: '0 5px' }}>
          {data.occupied ? data.parked_by : 'FREE'}
        </span>
      </div>
    );
  };

  return (
    <div>
      <h1 style={{ color: '#2c3e50', margin: '0 0 20px 0' }}>Dashboard Overview</h1>
      
      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <div style={{ ...styles.card, borderTop: '5px solid #3498db' }}>
          <h3 style={styles.cardTitle}>Total Users</h3>
          <p style={styles.cardValue}>👥 {stats.totalUsers}</p>
        </div>
        <div style={{ ...styles.card, borderTop: '5px solid #e74c3c' }}>
          <h3 style={styles.cardTitle}>Live Parked Cars</h3>
          <p style={styles.cardValue}>🚗 {stats.activeParkings}</p>
        </div>
        <div style={{ ...styles.card, borderTop: '5px solid #2ecc71' }}>
          <h3 style={styles.cardTitle}>Total Revenue</h3>
          <p style={{ ...styles.cardValue, color: '#27ae60' }}>💰 ₹{stats.totalRevenue}</p>
        </div>
      </div>

      {/* Live Parking Layout Monitoring */}
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Live Lot Status</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        
        {/* ENTRY GATE */}
        <div style={styles.gateEntry}>⬇ ENTRY GATE ⬇</div>

        {/* MAIN LOT AREA */}
        <div style={styles.lotContainer}>
          
          {/* LEFT COLUMN (A1, B1) */}
          <div style={styles.column}>
            <SlotCard data={getSlot('A1')} />
            <SlotCard data={getSlot('B1')} />
          </div>

          {/* CENTER DRIVEWAY */}
          <div style={styles.driveway}>
             <span style={styles.drivewayText}>DRIVEWAY</span>
          </div>

          {/* RIGHT COLUMN (A2, B2) */}
          <div style={styles.column}>
            <SlotCard data={getSlot('A2')} />
            <SlotCard data={getSlot('B2')} />
          </div>

        </div>

        {/* EXIT GATE */}
        <div style={styles.gateExit}>⬇ EXIT GATE ⬇</div>

      </div>
    </div>
  );
}

// --- CSS STYLES ---
const styles = {
  // Stats Cards
  card: { background: 'white', padding: '20px', borderRadius: '10px', flex: 1, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  cardTitle: { margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '1rem', textTransform: 'uppercase' },
  cardValue: { margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50' },

  // PARKING LOT ARCHITECTURE
  gateEntry: { background: '#27ae60', color: 'white', padding: '8px 40px', borderRadius: '10px 10px 0 0', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '-5px', zIndex: 10, position: 'relative', boxShadow: '0 -5px 15px rgba(0,0,0,0.1)' },
  gateExit: { background: '#c0392b', color: 'white', padding: '8px 40px', borderRadius: '0 0 10px 10px', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '-5px', zIndex: 10, position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
  lotContainer: { display: 'flex', justifyContent: 'center', background: '#34495e', padding: '40px 30px', borderRadius: '15px', border: '6px solid #2c3e50', gap: '20px', position: 'relative' },
  column: { display: 'flex', flexDirection: 'column', gap: '30px' },
  
  // THE ROAD
  driveway: { width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2c3e50', borderLeft: '4px dashed #f1c40f', borderRight: '4px dashed #f1c40f' },
  drivewayText: { color: 'rgba(255,255,255,0.15)', fontWeight: '900', letterSpacing: '8px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '2rem' },

  // INDIVIDUAL SLOTS (Admin view - no buttons)
  slot: { width: '130px', height: '90px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', border: '3px solid rgba(0,0,0,0.15)', transition: '0.3s' }
};

export default AdminDashboard;