function AdminCCTV() {
  return (
    <div>
      <h1 style={{ color: '#2c3e50', margin: '0 0 20px 0' }}>Live Surveillance</h1>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', maxWidth: '900px' }}>
        <h2 style={{ color: '#c0392b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ animation: 'blink 1.5s infinite' }}>🔴</span> LIVE FEED
        </h2>
        
        {/* 16:9 Aspect Ratio Container for the Video */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', background: 'black' }}>
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

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default AdminCCTV;