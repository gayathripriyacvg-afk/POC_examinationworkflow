import React, { useState, useEffect } from 'react';
import OSMDashboard from './OSMDashboard';
import './index.css';

function App() {
  const [theme, setTheme] = useState('alpha'); // 'alpha', 'beta', 'delta'

  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="App">
      <OSMDashboard theme={theme} setTheme={setTheme} />
    </div>
  );
}

export default App;
