import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Dashboard() {
  const [slots, setSlots] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) navigate('/');
    fetchLayout();
    const interval = setInterval(fetchLayout, 3000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchLayout = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/layout');
      setSlots(res.data);
    } catch (err) {
      console.error("Failed to fetch layout");
    }
  };

  const handlePark = async (slot_id) => {
    try {
      await axios.post('http://localhost:5000/api/park', { phone_no: user.phone_no, slot_id });
      fetchLayout(); // Refresh instantly
    } catch (err) {
      alert(err.response?.data?.message || "Failed to park");
    }
  };

  const handleLeave = async (slot_id) => {
    try {
      await axios.post('http://localhost:5000/api/leave', { phone_no: user.phone_no, slot_id });
      alert("Left the slot. Bill generated! Check your logs to pay.");
      fetchLayout();
    } catch (err) {
      alert("Failed to leave");
    }
  };

  const parkAnywhere = () => {
    const freeSlot = slots.find(s => !s.occupied);
    if (freeSlot) handlePark(freeSlot.id);
    else alert("Parking Lot is Full!");
  };

  // 🛑 RULE CHECK: Is this specific user already parked in ANY slot?
  const isUserAlreadyParked = slots.some(slot => slot.parked_by === user?.phone_no);

  // Helper function to safely render a slot without React re-mounting bugs
  const renderSlot = (slot_id) => {
    const slot = slots.find(s => s.id === slot_id) || { id: slot_id, occupied: false, parked_by: null };
    const isMyCar = slot.parked_by === user?.phone_no;
    const bg = isMyCar ? '#3498db' : slot.occupied ? '#e74c3c' : '#2ecc71';

    return (
      <div key={slot.id} style={{ ...styles.slot, background: bg }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>{slot.id}</h2>
        <span style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
          {isMyCar ? 'MY CAR' : slot.occupied ? 'BUSY' : 'FREE'}
        </span>
        
        {/* DEMO BUTTONS */}
        <div style={{ marginTop: '10px' }}>
          {/* Only show "Park Here" if the slot is empty AND the user hasn't parked anywhere else */}
          {!slot.occupied && !isUserAlreadyParked ? (
            <button onClick={() => handlePark(slot.id)} style={styles.actionBtn}>🛠️ Park</button>
          ) : isMyCar ? (
            <button onClick={() => handleLeave(slot.id)} style={{...styles.actionBtn, background: '#f1c40f'}}>🛠️ Leave</button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>🅿️ Smart Parking V2</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#2980b9', marginRight: '10px' }}>Hi, {user?.name}</span>
          <Link to="/logs" style={styles.navLink}>Logs</Link>
          <Link to="/cctv" style={styles.navLink}>CCTV</Link>
          <Link to="/profile" style={styles.navLink}>Profile</Link>
          <button style={styles.logoutBtn} onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
        </div>
      </nav>

      {/* AUTO PARK BUTTON */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={parkAnywhere} 
          disabled={isUserAlreadyParked}
          style={{ 
            ...styles.autoParkBtn, 
            background: isUserAlreadyParked ? '#95a5a6' : '#27ae60', 
            cursor: isUserAlreadyParked ? 'not-allowed' : 'pointer', 
            boxShadow: isUserAlreadyParked ? 'none' : '0 4px 15px rgba(39, 174, 96, 0.4)' 
          }}
        >
          {isUserAlreadyParked ? "🚗 ALREADY PARKED" : "🚗 AUTO PARK NOW"}
        </button>
      </div>

      {/* PARKING LOT VISUALIZATION */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* ENTRY GATE */}
        <div style={styles.gateEntry}>⬇ ENTRY GATE ⬇</div>

        {/* MAIN LOT AREA */}
        <div style={styles.lotContainer}>
          
          {/* LEFT COLUMN (A1, B1) */}
          <div style={styles.column}>
            {renderSlot('A1')}
            {renderSlot('B1')}
          </div>

          {/* CENTER DRIVEWAY */}
          <div style={styles.driveway}>
             <span style={styles.drivewayText}>DRIVEWAY</span>
          </div>

          {/* RIGHT COLUMN (A2, B2) */}
          <div style={styles.column}>
            {renderSlot('A2')}
            {renderSlot('B2')}
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
  page: { padding: '20px', fontFamily: 'sans-serif', background: '#ecf0f1', minHeight: '100vh' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  navLink: { textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold' },
  logoutBtn: { background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  autoParkBtn: { padding: '15px 30px', fontSize: '1.2rem', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', letterSpacing: '1px', transition: '0.2s' },
  
  // PARKING LOT ARCHITECTURE
  gateEntry: { background: '#27ae60', color: 'white', padding: '8px 40px', borderRadius: '10px 10px 0 0', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '-5px', zIndex: 10, position: 'relative', boxShadow: '0 -5px 15px rgba(0,0,0,0.1)' },
  gateExit: { background: '#c0392b', color: 'white', padding: '8px 40px', borderRadius: '0 0 10px 10px', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '-5px', zIndex: 10, position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
  lotContainer: { display: 'flex', justifyContent: 'center', background: '#34495e', padding: '40px 30px', borderRadius: '15px', border: '6px solid #2c3e50', gap: '20px', position: 'relative' },
  column: { display: 'flex', flexDirection: 'column', gap: '30px' },
  
  // THE ROAD
  driveway: { width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2c3e50', borderLeft: '4px dashed #f1c40f', borderRight: '4px dashed #f1c40f' },
  drivewayText: { color: 'rgba(255,255,255,0.15)', fontWeight: '900', letterSpacing: '8px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '2rem' },

  // INDIVIDUAL SLOTS
  slot: { width: '130px', height: '100px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', border: '3px solid rgba(0,0,0,0.15)', transition: '0.3s' },
  actionBtn: { cursor: 'pointer', padding: '5px 10px', borderRadius: '4px', border: 'none', fontWeight: 'bold', color: '#2c3e50', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }
};

export default Dashboard;