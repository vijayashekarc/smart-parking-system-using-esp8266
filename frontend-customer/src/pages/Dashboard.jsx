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
    
    // 2-second heartbeat to stay synced with the ESP8266 hardware
    const interval = setInterval(fetchLayout, 2000); 
    
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchLayout = async () => {
    try {
      // Cache-buster ensures we always get the live hardware state
      const res = await axios.get(`http://localhost:5000/api/layout?t=${new Date().getTime()}`);
      setSlots(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch layout:", err);
    }
  };

  // --- NEW WORKFLOW: 1. RESERVE SLOT ---
  const handleReserve = async () => {
    try {
      await axios.post('http://localhost:5000/api/reserve', { phone_no: user.phone_no });
      fetchLayout(); 
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reserve");
    }
  };

  // --- NEW WORKFLOW: 2. CANCEL RESERVATION ---
  const handleCancelReserve = async () => {
    try {
      await axios.post('http://localhost:5000/api/cancel-reservation', { phone_no: user.phone_no });
      fetchLayout();
    } catch (err) { 
      console.error(err); 
    }
  };

  // --- NEW WORKFLOW: 3. HARDWARE SIMULATIONS ---
  // These buttons pretend to be your physical ESP8266 sensors
  const simulateArrival = async (slot_id) => {
    await axios.post('http://localhost:5000/api/simulate-arrival', { slot_id });
    fetchLayout();
  };

  const simulateDeparture = async (slot_id) => {
    await axios.post('http://localhost:5000/api/simulate-departure', { slot_id });
    alert("Vehicle Left! The sensor has auto-generated your bill. Check Logs to pay.");
    fetchLayout();
  };

  // 🛑 RULE CHECK: Does the user have ANY active connection to a slot (reserved or parked)?
  const mySlot = slots.find(slot => slot.parked_by === user?.phone_no);
  const isBusy = !!mySlot; 

  // Helper function to safely render a slot without React re-mounting bugs
  const renderSlot = (slot_id) => {
    const slot = slots.find(s => s.id === slot_id) || { id: slot_id, occupied: false, reserved: false, parked_by: null };
    
    const isMyReservation = slot.reserved && slot.parked_by === user?.phone_no;
    const isMyCar = slot.occupied && slot.parked_by === user?.phone_no;
    
    // UI COLORS: Occupied = Blue, Reserved = Orange, Busy/Stranger = Red, Free = Green
    let bg = '#2ecc71'; // Free
    if (slot.occupied && !isMyCar) bg = '#e74c3c'; // Stranger Parked
    if (slot.reserved && !isMyReservation) bg = '#e74c3c'; // Stranger Reserved
    if (isMyReservation) bg = '#f39c12'; // Reserved by ME
    if (isMyCar) bg = '#3498db'; // Parked by ME

    let statusText = 'FREE';
    if (isMyReservation) statusText = 'RESERVED (Drive in!)';
    else if (isMyCar) statusText = 'MY CAR';
    else if (slot.occupied || slot.reserved) statusText = 'BUSY';

    return (
      <div key={slot.id} style={{ ...styles.slot, background: bg }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>{slot.id}</h2>
        <span style={{ fontSize: '0.65rem', letterSpacing: '1px', textAlign: 'center' }}>
          {statusText}
        </span>
        
        {/* SIMULATION BUTTONS */}
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          
          {isMyReservation && (
            <>
              <button onClick={handleCancelReserve} style={{...styles.simBtn, background: '#c0392b', color: 'white'}}>Cancel Res.</button>
              <button onClick={() => simulateArrival(slot.id)} style={styles.simBtn}>[Simulate Arrival]</button>
            </>
          )}

          {isMyCar && (
             <button onClick={() => simulateDeparture(slot.id)} style={styles.simBtn}>[Simulate Leave]</button>
          )}
          
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

      {/* RESERVE BUTTON */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={handleReserve} 
          disabled={isBusy}
          style={{ 
            ...styles.autoParkBtn, 
            background: isBusy ? '#95a5a6' : '#8e44ad', // Purple for Reserve
            cursor: isBusy ? 'not-allowed' : 'pointer', 
            boxShadow: isBusy ? 'none' : '0 4px 15px rgba(142, 68, 173, 0.4)' 
          }}
        >
          {isBusy ? "🎟️ SLOT ALREADY CLAIMED" : "🎟️ RESERVE NEAREST SLOT"}
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
  slot: { width: '130px', height: '110px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', border: '3px solid rgba(0,0,0,0.15)', transition: '0.3s' },
  simBtn: { cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', border: 'none', fontWeight: 'bold', fontSize: '0.65rem', color: '#2c3e50', background: 'rgba(255,255,255,0.9)', transition: '0.2s' }
};

export default Dashboard;