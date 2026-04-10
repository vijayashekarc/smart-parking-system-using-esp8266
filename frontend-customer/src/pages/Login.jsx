import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '', phone_no: '', email_id: '', password: '', 
    vehicle_name: '', vehicle_plate_no: '', vehicle_type: '4 wheeler'
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/signup';
    
    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, formData);
      if (res.data.success) {
        // Save user to local storage and go to dashboard
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#2c3e50', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>
          {isLogin ? '🅿️ Welcome Back' : '🚗 Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <>
              <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required style={styles.input} />
              <input type="email" name="email_id" placeholder="Email ID" onChange={handleChange} required style={styles.input} />
              <input type="text" name="vehicle_name" placeholder="Vehicle Name (e.g., Honda City)" onChange={handleChange} required style={styles.input} />
              <input type="text" name="vehicle_plate_no" placeholder="License Plate (e.g., KA01AB1234)" onChange={handleChange} required style={styles.input} />
              <select name="vehicle_type" onChange={handleChange} style={styles.input}>
                <option value="4 wheeler">4 Wheeler</option>
                <option value="2 wheeler">2 Wheeler</option>
              </select>
            </>
          )}
          
          <input type="text" name="phone_no" placeholder="Phone Number" onChange={handleChange} required style={styles.input} />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required style={styles.input} />
          
          <button type="submit" style={styles.btn}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', cursor: 'pointer', color: '#3498db', fontWeight: 'bold' }} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}

const styles = {
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  btn: { padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};

export default Login;