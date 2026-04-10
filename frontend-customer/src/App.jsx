import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Logs from './pages/Logs';
import CCTV from './pages/CCTV';

function App() {
  const isAuthenticated = !!localStorage.getItem('user');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/cctv" element={<CCTV />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;