import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

function ExitScanner() {
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [message, setMessage] = useState('Show your QR Code to exit');

  useEffect(() => {
    // Initialize the camera scanner
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });

    if (status === 'idle') {
      scanner.render(onScanSuccess, onScanError);
    }

    async function onScanSuccess(decodedText) {
      scanner.clear(); 
      setStatus('processing');
      setMessage('Verifying payment status...');

      // ⚠️ UPDATE THIS TO YOUR ESP8266 IP ADDRESS
      const ESP_IP = process.env.ESP_IP; 

      try {
        const res = await axios.post('http://localhost:7000/api/exit/verify', { qr_data: decodedText });
        
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message);
          
          // --- NEW: TRIGGER THE PHYSICAL GATE ---
          try {
             await axios.get(`http://${ESP_IP}/api/servo?state=on`);
             console.log("Hardware Gate Opened!");
          } catch (hwError) {
             console.error("Payment cleared, but could not reach ESP8266 Gate:", hwError);
             setMessage("✅ Clear! (Hardware Gate Offline)");
          }

          setTimeout(() => resetScanner(), 5000);
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || "Invalid QR Code or System Error");
        setTimeout(() => resetScanner(), 5000);
      }
    }

    function onScanError(err) {
      // Ignore background scanning errors (happens when no QR is in frame)
    }

    return () => {
      if (document.getElementById('reader')) {
        scanner.clear().catch(console.error);
      }
    };
  }, [status]);

  const resetScanner = () => {
    setStatus('idle');
    setMessage('Show your QR Code to exit');
  };

  // Dynamic Background Colors
  const getBgColor = () => {
    if (status === 'success') return '#27ae60'; // Green
    if (status === 'error') return '#c0392b';   // Red
    if (status === 'processing') return '#2980b9'; // Blue
    return '#2c3e50'; // Default Dark Blue
  };

  return (
    <div style={{ ...styles.page, backgroundColor: getBgColor() }}>
      <div style={styles.card}>
        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>🚪 EXIT KIOSK</h1>
        
        <h3 style={{ color: status === 'error' ? '#c0392b' : '#7f8c8d', minHeight: '50px' }}>
          {message}
        </h3>

        {/* Camera Container */}
        <div 
          id="reader" 
          style={{ width: '100%', display: status === 'idle' ? 'block' : 'none', border: 'none' }}
        ></div>

        {/* Big Emoji Status */}
        {status !== 'idle' && (
          <div style={{ fontSize: '6rem', margin: '40px 0', animation: 'pulse 1s infinite' }}>
            {status === 'success' ? '✅' : status === 'error' ? '🛑' : '⏳'}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    fontFamily: 'sans-serif',
    transition: 'background-color 0.4s ease'
  },
  card: { 
    background: 'white', 
    padding: '40px', 
    borderRadius: '20px', 
    width: '90%', 
    maxWidth: '500px', 
    textAlign: 'center', 
    boxShadow: '0 15px 35px rgba(0,0,0,0.3)' 
  }
};

export default ExitScanner;