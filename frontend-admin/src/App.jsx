import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AllLogs from './pages/AllLogs';
import AdminCCTV from './pages/AdminCCTV';

// A tiny wrapper component so we can use useLocation() for highlighting the active tab
function AdminLayout() {
  const location = useLocation();

  const getLinkStyle = (path) => ({
    ...styles.navLink,
    background: location.pathname === path ? '#3498db' : '#34495e',
    color: location.pathname === path ? 'white' : '#bdc3c7'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', background: '#ecf0f1' }}>
      
      {/* Sidebar */}
      <div style={{ width: '250px', background: '#2c3e50', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ color: '#f1c40f', textAlign: 'center', margin: '0 0 20px 0' }}>👑 ADMIN PANEL</h2>
        
        <Link to="/" style={getLinkStyle('/')}>📊 Dashboard</Link>
        <Link to="/logs" style={getLinkStyle('/logs')}>📜 All Logs</Link>
        <Link to="/cctv" style={getLinkStyle('/cctv')}>📹 CCTV Feed</Link>
        
        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.8rem', color: '#7f8c8d' }}>
          Smart Parking V2<br/>Control Center
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/logs" element={<AllLogs />} />
          <Route path="/cctv" element={<AdminCCTV />} />
        </Routes>
      </div>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AdminLayout />
    </BrowserRouter>
  );
}

const styles = {
  navLink: { 
    textDecoration: 'none', 
    padding: '12px 15px', 
    borderRadius: '8px', 
    fontWeight: 'bold', 
    display: 'block', 
    transition: '0.2s ease' 
  }
};

export default App;