import { Link } from 'react-router-dom';

function CCTV() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#ecf0f1', minHeight: '100vh' }}>
      <Link to="/dashboard" style={{ display: 'block', marginBottom: '20px', textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold' }}>
        ← Back to Dashboard
      </Link>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '15px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h2 style={{ color: '#c0392b', marginBottom: '20px' }}>🔴 LIVE SURVEILLANCE</h2>
        
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '10px', background: 'black' }}>
          {/* Replace this YouTube embed link with your actual stream link if you have one */}
          <iframe 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            src="https://www.youtube.com/embed/4a-3iEM7bHk?autoplay=1&mute=1" 
            title="Live CCTV Feed" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default CCTV;