import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Folder, FileText, CheckCircle2 } from 'lucide-react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [tree, setTree] = useState([]);
  const fileInputRef = useRef(null);
  
  // Use dynamically host-aware url for the backend
  const baseUrl = `http://${window.location.hostname}:6000`;

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/documents`);
      const data = await res.json();
      if (data.success && data.folders) {
        setTree(data.folders);
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        setMessage('');
      } else {
        setMessage('Error: Please select a valid PDF file.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      setMessage('Uploading...');
      const res = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage('Upload successful! Structured folder created.');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchFolders(); // Refresh tree
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error during upload.');
    }
  };

  const renderTree = (node, depth = 0) => {
    if (!node) return null;
    return (
      <div key={node.name + depth} style={{ marginLeft: `${depth * 20}px`, marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {node.isDirectory ? <Folder size={18} color="#facc15" /> : <FileText size={18} color="#ef4444" />}
          <span style={{ fontFamily: 'monospace' }}>{node.name}</span>
        </div>
        {node.children && node.children.map(child => renderTree(child, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Scanner Flow Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Upload physical scanned PDFs. The system will automatically create structured folders for them on the backend.</p>

      <div style={{ display: 'flex', gap: '2rem' }}>
        
        {/* Upload Section */}
        <div style={{ flex: 1, padding: '1.5rem', border: '1px dashed #ccc', borderRadius: '8px', background: '#f9fafb' }}>
          <h2>Upload PDF</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            {file && <p style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16}/> {file.name} selected</p>}
            
            <button 
              onClick={handleUpload}
              disabled={!file}
              style={{ padding: '0.75rem', background: file ? '#3b82f6' : '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', cursor: file ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <UploadCloud size={20} /> Upload to Server
            </button>
            {message && <p style={{ color: message.includes('Error') ? 'red' : 'green', fontWeight: 'bold' }}>{message}</p>}
          </div>
        </div>

        {/* Directory Structure Section */}
        <div style={{ flex: 1, padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#ffffff', overflowY: 'auto', maxHeight: '400px' }}>
          <h2>Backend Storage tree</h2>
          {tree.length === 0 ? (
            <p style={{ color: '#9ca3af', marginTop: '1rem' }}>No folders created yet. Upload a PDF to initialize the directory structure.</p>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {tree.map(node => renderTree(node))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
