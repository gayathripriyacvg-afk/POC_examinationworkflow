import { useState } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      // Dynamically target the backend port (5000) on the same host address 
      // where the frontend is being served from (useful when using --host on a local network)
      const baseUrl = `http://${window.location.hostname}:5000`;
      
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'SuperAdmin' }),
      });
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setMessage(`Success! Welcome back, ${data.user.username}`);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error connecting to the backend.');
    }
  };

  if (user) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1>Super Admin Dashboard</h1>
        <p>Welcome, {user.username}!</p>
        <p>Role: {user.role}</p>
        <button onClick={() => setUser(null)} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Super Admin Login</h1>
      <p style={{ color: '#666' }}>Test Credentials: superadmin / password123</p>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
            required
          />
        </div>
        <button type="submit" style={{ padding: '0.75rem', cursor: 'pointer', background: '#000', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold' }}>
          Login
        </button>
      </form>
      {message && <p style={{ marginTop: '1rem', fontWeight: 'bold', color: message.includes('Error') || message.includes('error') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}

export default App;
