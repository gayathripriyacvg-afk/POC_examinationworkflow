import React, { useState, useEffect, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import {
  ScanLine, Wifi, Upload, FolderOpen, Image,
  ChevronRight, ChevronDown, Trash2, RotateCcw,
  BookOpen, Download, X, Settings, Camera, Monitor,
  Zap, FileCheck, Clock, AlertCircle, ArrowLeft, ArrowRight,
  Sun, Sliders, ChevronLeft, Target,
} from 'lucide-react';
import { applyGrayscale, applyAdaptiveThreshold, applyContrast, applyAlphaBeta, applyGammaCorrection, applyPaperColorizer } from './utils/imageProcessing';
import PaperColorizer from './utils/papercolorizer';
import './App.css';

// ─── Constants ────────────────────────────────────────────────
const BASE_URL = `http://${window.location.hostname}:6005`;

const DIGITAL_SAMPLES = [
  { id: 'biology_good',  label: 'Biology — Clean Handwriting',   file: '/samples/biology_good.png',  pages: 32 },
  { id: 'biology_messy', label: 'Biology — Messy Handwriting',   file: '/samples/biology_messy.png', pages: 28 },
  { id: 'biology',       label: 'Biology Sample',                file: '/samples/biology.png',        pages: 24 },
  { id: 'real_bio_exam', label: 'Real Bio Exam Sheet',           file: '/samples/real_bio_exam.png',  pages: 20 },
  { id: 'pen',           label: 'Pen Written Answer',            file: '/samples/pen.png',            pages: 16 },
  { id: 'pencil',        label: 'Pencil Written Answer',         file: '/samples/pencil.png',         pages: 16 },
  { id: 'mixed',         label: 'Mixed Sheet',                   file: '/samples/mixed.png',          pages: 20 },
  { id: 'light_black',   label: 'Light/Black Contrast Sheet',    file: '/samples/light_black.png',    pages: 12 },
  { id: 'omr_real',      label: 'OMR Answer Sheet',              file: '/samples/omr_real.png',       pages:  4 },
];

const FILTERS = [
  { id: 'none',               label: 'Raw',       icon: '◻' },
  { id: 'grayscale',          label: 'Grayscale', icon: '▨' },
  { id: 'adaptive_threshold', label: 'Adaptive',  icon: '◈' },
  { id: 'high_contrast',      label: 'Contrast',  icon: '◑' },
];

const MOCK_ROSTER = [
  { id: 'S001', name: 'Arjun Mehta',  roll: '10-A / 01', status: 'complete'   },
  { id: 'S002', name: 'Priya Sharma', roll: '10-A / 02', status: 'present'    },
  { id: 'S003', name: 'Ravi Kumar',   roll: '10-A / 03', status: 'processing' },
  { id: 'S004', name: 'Sneha Nair',   roll: '10-A / 04', status: 'absent'     },
  { id: 'S005', name: 'Vikram Singh', roll: '10-A / 05', status: 'present'    },
  { id: 'S006', name: 'Divya Patel',  roll: '10-A / 06', status: 'complete'   },
  { id: 'S007', name: 'Anjali Reddy', roll: '10-A / 07', status: 'absent'     },
  { id: 'S008', name: 'Karthik Iyer', roll: '10-A / 08', status: 'present'    },
];

// ─── Auth Screen ──────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (u === 'admin' && p === 'admin123') onLogin({ name: 'Admin Operator' });
    else setErr('Invalid credentials. Try  admin / admin123');
  };
  return (
    <div className="auth-container">
      <div className="panel-card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div className="brand-logo" style={{ margin: '0 auto 1rem', width: 56, height: 56, fontSize: '2rem' }}>⚡</div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Examic ScanStation</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>Sign in to begin scanning session</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="input-group">
            <label>Username</label>
            <input className="glass-input" value={u} onChange={e => setU(e.target.value)} placeholder="admin" autoFocus />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input className="glass-input" type="password" value={p} onChange={e => setP(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <p style={{ color: 'var(--neon-red)', fontSize: '0.8rem', margin: 0 }}>{err}</p>}
          <button className="glass-button" type="submit"><Zap size={16} /> Sign In</button>
        </form>
      </div>
    </div>
  );
}

// ─── Explorer Tree ────────────────────────────────────────────
function ExplorerTree({ nodes, depth = 0, parentPath = '', onSelectFile }) {
  const [open, setOpen] = useState({});
  if (!nodes?.length) return null;
  return (
    <div>
      {nodes.map((node, i) => {
        const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        return (
          <div key={node.name + i}>
            <div
              className={`explorer-node ${node.isDirectory ? '' : 'file'}`}
              style={{ paddingLeft: `${0.5 + depth}rem`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
              onClick={() => {
                if (node.isDirectory) {
                  setOpen(o => ({ ...o, [node.name]: !o[node.name] }));
                } else if (onSelectFile) {
                  onSelectFile(node, currentPath);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                {node.isDirectory ? (open[node.name] ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span style={{ width: 12, display: 'inline-block' }} />}
                {node.isDirectory ? <FolderOpen size={14} color="var(--neon-amber)" /> : <BookOpen size={14} color="var(--neon-blue)" />}
                <span className="explorer-node-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: !node.isDirectory ? 'underline' : 'none' }}>
                  {node.name}
                </span>
              </div>
              {!node.isDirectory && (
                <a
                  href={`${BASE_URL}/uploads/${currentPath.startsWith('uploads/') ? currentPath.substring(8) : currentPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', color: 'var(--neon-purple)', marginLeft: 8, cursor: 'pointer', textDecoration: 'none' }}
                  title="Open Raw PDF in New Tab"
                >
                  <Monitor size={12} style={{ marginRight: 2 }} />
                  <span style={{ fontSize: '0.65rem' }}>View</span>
                </a>
              )}
            </div>
            {node.isDirectory && open[node.name] && node.children && (
              <ExplorerTree nodes={node.children} depth={depth + 1} parentPath={currentPath} onSelectFile={onSelectFile} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Manual Upload ────────────────────────────────────────────
function ManualUpload({ baseUrl, onSuccess }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setMsg('❌ Only PDF files are supported.');
        setFile(null);
      } else {
        setFile(selected);
        setMsg('');
      }
    }
  };

  const go = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('pdf', file);
    setBusy(true);
    setMsg('Uploading…');
    try {
      const r = await fetch(`${baseUrl}/api/upload`, { method: 'POST', body: fd });
      const d = await r.json();
      if (d.success) {
        setMsg('✅ Booklet uploaded successfully!');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onSuccess(d);
      } else {
        setMsg(`❌ ${d.message}`);
      }
    } catch {
      setMsg('❌ Network upload error.');
    }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {/* Standard visible styled uploader container */}
      <div
        style={{
          border: '2px dashed rgba(192, 132, 252, 0.4)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 10,
          padding: '1rem 0.75rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 115,
          position: 'relative'
        }}
      >
        <Upload size={20} color="var(--neon-purple)" />
        
        {file ? (
          <div style={{ width: '100%' }}>
            <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.62rem', color: '#94a3b8' }}>
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#f8fafc', fontWeight: 500 }}>
              Select a PDF Booklet
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '0.62rem', color: '#94a3b8' }}>
              PDF format only (Max 25MB)
            </p>
          </div>
        )}

        {/* Highly accessible, clickable, visible file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{
            marginTop: '6px',
            fontSize: '0.7rem',
            color: '#94a3b8',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '200px'
          }}
        />
      </div>

      {file && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            className="glass-button" 
            onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            style={{ flex: 1, padding: '0.42rem', fontSize: '0.72rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8' }}
            disabled={busy}
          >
            Cancel
          </button>
          <button 
            className="glass-button" 
            onClick={go} 
            disabled={busy} 
            style={{ flex: 1.5, padding: '0.42rem', fontSize: '0.72rem' }}
          >
            {busy ? 'Uploading…' : 'Start Upload'}
          </button>
        </div>
      )}

      {msg && (
        <p style={{ 
          fontSize: '0.7rem', 
          margin: '2px 0 0', 
          textAlign: 'center',
          fontWeight: 600,
          color: msg.startsWith('✅') ? '#4ade80' : '#f87171' 
        }}>
          {msg}
        </p>
      )}
    </div>
  );
}

// ─── Settings Bottom Drawer (Mobile-style) ────────────────────
function SettingsDrawer({ open, onClose, filter, setFilter, contrast, setContrast,
                          alpha, setAlpha, beta, setBeta, gamma, setGamma, delta, setDelta }) {
  if (!open) return null;

  const greekSlider = (symbol, name, desc, value, setter, min, max, step, fmt) => (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'0.35rem' }}>
        <span style={{ fontSize:'1rem', color:'var(--neon-purple)', fontWeight:700 }}>{symbol}</span>
        <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{name}</span>
        <span style={{ fontFamily:'monospace', fontSize:'0.8rem', color:'var(--neon-amber)', minWidth:36, textAlign:'right' }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => setter(Number(e.target.value))}
        style={{ width:'100%', accentColor:'var(--neon-purple)', height:5 }} />
      <div style={{ fontSize:'0.68rem', color:'rgba(148,163,184,0.6)', marginTop:'0.2rem' }}>{desc}</div>
    </div>
  );

  return (
    <div className="settings-drawer-overlay" onClick={onClose}>
      <div className="settings-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'var(--neon-purple)' }}>⚙️ CV Settings</h3>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid var(--border-color)', color:'var(--text-secondary)', borderRadius:'50%', width:28, height:28, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14}/>
          </button>
        </div>

        {/* Filter Pills */}
        <p style={{ fontSize:'0.7rem', color:'var(--text-secondary)', margin:'0 0 0.5rem', textTransform:'uppercase', letterSpacing:1 }}>Filter Mode</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:'1rem' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding:'0.6rem 0.5rem', borderRadius:10, cursor:'pointer', textAlign:'center',
                border:`2px solid ${filter===f.id?'var(--neon-purple)':'var(--border-color)'}`,
                background: filter===f.id?'rgba(192,132,252,0.15)':'rgba(255,255,255,0.04)',
                color: filter===f.id?'var(--neon-purple)':'var(--text-secondary)',
                fontSize:'0.82rem', fontWeight: filter===f.id?700:400, transition:'all 0.15s' }}>
              <div style={{ fontSize:'1.4rem', marginBottom:'0.2rem' }}>{f.icon}</div>
              {f.label}
            </button>
          ))}
        </div>

        {/* Contrast (high_contrast mode only) */}
        {filter === 'high_contrast' && (
          <div style={{ marginBottom:'1rem', padding:'0.6rem', background:'rgba(192,132,252,0.06)', borderRadius:8, border:'1px solid rgba(192,132,252,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
              <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1 }}>Contrast Boost</span>
              <span style={{ fontFamily:'monospace', fontSize:'0.8rem', color:'var(--neon-amber)' }}>{contrast}</span>
            </div>
            <input type="range" min="0" max="128" value={contrast} onChange={e=>setContrast(Number(e.target.value))}
              style={{ width:'100%', accentColor:'var(--neon-purple)' }} />
          </div>
        )}

        {/* Greek letter controls */}
        <p style={{ fontSize:'0.7rem', color:'var(--text-secondary)', margin:'0 0 0.75rem', textTransform:'uppercase', letterSpacing:1 }}>Lighting Correction</p>
        {greekSlider('α', 'Alpha · Brightness Gain', 'Multiplies each pixel value. < 1 = darker, > 1 = brighter', alpha, setAlpha, 0.5, 2.5, 0.05, v => v.toFixed(2))}
        {greekSlider('β', 'Beta · Brightness Bias', 'Adds a flat offset to every pixel. Positive = lift shadows', beta, setBeta, -80, 80, 1, v => (v >= 0 ? '+' : '') + v)}
        {greekSlider('γ', 'Gamma · Tonal Curve', '< 1 lifts shadows, > 1 crushes highlights, 1.0 = neutral', gamma, setGamma, 0.3, 3.0, 0.1, v => v.toFixed(1))}
        {greekSlider('δ', 'Delta · Adaptive Threshold', 'Offset constant for adaptive threshold filter', delta, setDelta, 1, 30, 1, v => v)}

        <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.5rem' }}>
          <button onClick={() => { setAlpha(1.0); setBeta(0); setGamma(1.0); setDelta(5); }}
            style={{ flex:1, padding:'0.5rem', background:'transparent', border:'1px solid var(--border-color)', color:'var(--text-secondary)', borderRadius:8, cursor:'pointer', fontSize:'0.78rem' }}>
            Reset Defaults
          </button>
          <button className="glass-button" onClick={onClose} style={{ flex:1 }}>Apply &amp; Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);

  // Source
  const [sourceMode, setSourceMode] = useState('digital');
  const [sampleId, setSampleId] = useState('biology_good');

  // CV
  const [filter, setFilter]     = useState('adaptive_threshold');
  const [contrast, setContrast] = useState(30);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // α β γ δ — lighting correction parameters
  const [alpha, setAlpha] = useState(1.0);  // brightness gain
  const [beta, setBeta]   = useState(0);    // brightness bias
  const [gamma, setGamma] = useState(1.0);  // gamma curve
  const [delta, setDelta] = useState(5);    // adaptive threshold constant

  // Pro Camera Cockpit & Scan Methods states
  const [scanMethod, setScanMethod] = useState('raw_processed'); // 'raw_processed' or 'dual_book'
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [cameraAspect, setCameraAspect] = useState('A4');
  const [cameraIso, setCameraIso] = useState(100);
  const [cameraWb, setCameraWb] = useState('auto'); // 'auto', 'warm', 'cool', 'daylight', 'cloudy'
  const [gridlinesActive, setGridlinesActive] = useState(false);
  const [cameraFlash, setCameraFlash] = useState('off');
  const [triggerFlashEffect, setTriggerFlashEffect] = useState(false);

  // Mobile camera-style overlay states
  const [proDockOpen, setProDockOpen] = useState(true);
  const [focusRing, setFocusRing]     = useState(null);
  const [expIndicator, setExpIndicator] = useState(null);
  const [showRightSettings, setShowRightSettings] = useState(false);
  const [expTimer, setExpTimer]       = useState(null);

  // Hoisted Paper Colorizer states
  const [stylerActive, setStylerActive] = useState(false);
  const [stylerBg, setStylerBg] = useState('#fffef0');
  const [stylerTxt, setStylerTxt] = useState('#1a237e');
  const [stylerTolerance, setStylerTolerance] = useState(60);
  const [stylerBrightness, setStylerBrightness] = useState(180);
  const [stylerInkThresh, setStylerInkThresh] = useState(100);
  const [stylerInkStrength, setStylerInkStrength] = useState(80);

  const updateAlpha = (val) => {
    setAlpha(val);
    triggerExpIndicator('☀️', 'Alpha (Gain)', val.toFixed(2));
  };
  const updateBeta = (val) => {
    setBeta(val);
    triggerExpIndicator('🌗', 'Beta (Bias)', (val >= 0 ? '+' : '') + val);
  };
  const updateGamma = (val) => {
    setGamma(val);
    triggerExpIndicator('📈', 'Gamma (Curve)', val.toFixed(1));
  };
  const updateDelta = (val) => {
    setDelta(val);
    triggerExpIndicator('🎯', 'Delta (Detail)', val);
  };

  const triggerExpIndicator = (icon, label, val) => {
    setExpIndicator({ icon, label, val });
    if (expTimer) clearTimeout(expTimer);
    const t = setTimeout(() => setExpIndicator(null), 1200);
    setExpTimer(t);
  };

  // State for horizontal scrolling settings tab in CV Studio
  const [activeProTab, setActiveProTab] = useState('alpha');

  // PDF.js and Custom document samples states
  const [customSamples, setCustomSamples] = useState([]);
  const [pdfDocInstance, setPdfDocInstance] = useState(null);
  const [pdfRendering, setPdfRendering]   = useState(false);
  const pdfCanvasRef = useRef(null);

  // Dynamically load pdf.js in browser from standard CDN on mount
  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        // If window.pdfjsLib is already set by standard global bundle, keep it.
        // Otherwise fallback to window['pdfjs-dist/build/pdf']
        if (!window.pdfjsLib && window['pdfjs-dist/build/pdf']) {
          window.pdfjsLib = window['pdfjs-dist/build/pdf'];
        }
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
          console.log('pdf.js loaded successfully!');
        } else {
          console.error('pdf.js loaded but pdfjsLib namespace is not set on window.');
        }
      };
      document.head.appendChild(script);
    } else {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
  }, []);

  const loadPdfDocument = async (url, activeSampleId) => {
    if (!window.pdfjsLib) {
      console.warn('pdfjsLib is not loaded yet');
      return 1;
    }
    try {
      const loadingTask = window.pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDocInstance(pdf);
      
      // Update customSamples state with the correct page count to trigger React state updates!
      if (activeSampleId) {
        setCustomSamples(prev => prev.map(s => {
          if (s.id === activeSampleId) {
            return { ...s, pages: pdf.numPages };
          }
          return s;
        }));
      }
      
      return pdf.numPages;
    } catch (err) {
      console.error('Error loading PDF via pdf.js:', err);
      return 1;
    }
  };

  // Handle manual PDF selection from Storage Explorer Tree
  const handleSelectFile = (node, pathStr) => {
    if (!pathStr.endsWith('.pdf')) return;
    const relativeUrl = pathStr.startsWith('uploads/') ? pathStr.substring(8) : pathStr;
    const fileUrl = `${BASE_URL}/uploads/${relativeUrl}`;
    
    const newSample = {
      id: `custom_${Date.now()}`,
      label: `File: ${node.name}`,
      file: fileUrl,
      isPdf: true,
      pages: 1
    };
    
    setCustomSamples(prev => [newSample, ...prev]);
    setSampleId(newSample.id);
    setSourceMode('digital');
  };

  // Handle automated upload selection to view PDF immediately in dual viewports
  const handleUploadSuccess = (uploadData) => {
    fetchTree();
    fetchUploadedPdfs();
    if (uploadData && uploadData.pdfUrl && uploadData.filename) {
      const newSample = {
        id: `custom_${Date.now()}`,
        label: `Uploaded: ${uploadData.filename}`,
        file: uploadData.pdfUrl,
        isPdf: true,
        pages: 1
      };
      setCustomSamples(prev => [newSample, ...prev]);
      setSampleId(newSample.id);
      setSourceMode('digital');
    }
  };

  const handleSelectUploadedPdf = (pdfItem) => {
    const newSample = {
      id: `custom_${pdfItem._id || Date.now()}`,
      label: `Uploaded: ${pdfItem.filename}`,
      file: pdfItem.pdfUrl,
      isPdf: true,
      pages: 1
    };
    setCustomSamples(prev => {
      if (prev.some(s => s.file === pdfItem.pdfUrl)) return prev;
      return [newSample, ...prev];
    });
    setSampleId(newSample.id);
    setSourceMode('digital');
  };

  const handleViewportClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusRing({ x, y });
    
    // Simulate camera focus beep / fade
    setTimeout(() => {
      setFocusRing(null);
    }, 1500);
  };

  const [uploadedPdfs, setUploadedPdfs] = useState([]);

  // Scanning
  const [isScanning, setIsScanning] = useState(false);
  const [capturedPages, setCapturedPages] = useState([]);
  const [retakeIndex, setRetakeIndex] = useState(null);
  const [mockPageNumber, setMockPageNumber] = useState(1);

  // Webcam
  const webcamRef  = useRef(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError]   = useState('');

  // Canvases
  const rawCanvasRef  = useRef(null);
  const procCanvasRef = useRef(null);
  const rafRef        = useRef(null);

  // Sample image
  const imgRef     = useRef(null);
  const leftImgRef = useRef(null);
  const rightImgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Backend
  const [tree, setTree]         = useState([]);
  const [treeLoading, setTL]    = useState(false);
  const [history, setHistory]   = useState([]);
  const [progress, setProgress] = useState(null);

  const [imageFormat, setImageFormat] = useState('image/jpeg');
  const [allowExtraPages, setAllowExtraPages] = useState(false);

  const [telemetry, setTelemetry] = useState({
    captureFormat: 'JPEG',
    captureTime: 0,
    pdfCompileTime: 0,
    uploadTime: 0,
    downloadTimeJpeg: 0,
    downloadTimePng: 0,
    downloadTimePdf: 0,
  });

  const [aiMetrics, setAiMetrics] = useState({
    focus: 98.4,
    skew: 0.15,
    blur: 0.015,
    ocr: 97.8
  });

  useEffect(() => {
    const t = setInterval(() => {
      setAiMetrics(prev => ({
        focus: Math.min(100, Math.max(95, prev.focus + (Math.random() - 0.5) * 0.4)),
        skew: Math.max(0, prev.skew + (Math.random() - 0.5) * 0.05),
        blur: Math.max(0.005, prev.blur + (Math.random() - 0.5) * 0.003),
        ocr: Math.min(100, Math.max(94, prev.ocr + (Math.random() - 0.5) * 0.3))
      }));
    }, 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (capturedPages.length === 0) {
      setTelemetry({
        captureFormat: 'JPEG',
        captureTime: 0,
        pdfCompileTime: 0,
        uploadTime: 0,
        downloadTimeJpeg: 0,
        downloadTimePng: 0,
        downloadTimePdf: 0,
      });
    }
  }, [capturedPages.length]);

  // Derived
  const allSamples = [...DIGITAL_SAMPLES, ...customSamples];
  const sample     = allSamples.find(s => s.id === sampleId);
  const totalPages = sourceMode === 'digital' ? (sample?.pages ?? null) : null;
  const maxReached = totalPages !== null && capturedPages.length >= totalPages && retakeIndex === null && !allowExtraPages;

  // ── Load digital image ──
  useEffect(() => {
    if (sourceMode !== 'digital' || !sample?.file) { setImgLoaded(false); return; }
    
    if (sample.isPdf || sample.file.endsWith('.pdf')) {
      setImgLoaded(false);
      loadPdfDocument(sample.file, sample.id).then(pagesCount => {
        if (pagesCount) {
          sample.pages = pagesCount;
          setMockPageNumber(1);
          setCapturedPages([]);
          setRetakeIndex(null);
        }
      });
      return;
    }

    const img = new window.Image();
    img.src = sample.file;
    img.onload  = () => { 
      imgRef.current = img; 
      leftImgRef.current = img;
      rightImgRef.current = img;
      setImgLoaded(true); 
    };
    img.onerror = () => setImgLoaded(false);
    setMockPageNumber(1);
    setCapturedPages([]);
    setRetakeIndex(null);
  }, [sampleId, sourceMode]);

  // Render PDF pages asynchronously to offscreen canvas whenever pages/sample changes
  useEffect(() => {
    if (sourceMode !== 'digital' || !pdfDocInstance || !sample) return;
    let active = true;
    
    const renderPdfPage = async (pageNum, targetRef) => {
      if (pageNum <= 0) {
        targetRef.current = null;
        return;
      }
      setPdfRendering(true);
      try {
        const page = await pdfDocInstance.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        if (active) {
          targetRef.current = canvas;
          setImgLoaded(true);
        }
      } catch (err) {
        console.error('Error rendering PDF page:', err);
      }
      setPdfRendering(false);
    };

    if (scanMethod === 'raw_processed') {
      renderPdfPage(mockPageNumber, imgRef);
    } else {
      const leftPageNum = (mockPageNumber % 2 === 0) ? mockPageNumber : (mockPageNumber - 1);
      const rightPageNum = (mockPageNumber % 2 !== 0) ? mockPageNumber : (mockPageNumber + 1);
      
      renderPdfPage(leftPageNum, leftImgRef);
      renderPdfPage(rightPageNum, rightImgRef);
    }
    
    return () => { active = false; };
  }, [mockPageNumber, pdfDocInstance, sampleId, sourceMode, scanMethod]);

  // ── Webcam ──
  useEffect(() => {
    if (sourceMode !== 'webcam') {
      webcamRef.current?.srcObject?.getTracks().forEach(t => t.stop());
      if (webcamRef.current) webcamRef.current.srcObject = null;
      setWebcamActive(false); setWebcamError('');
      return;
    }
    setWebcamError('');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => { if (webcamRef.current) { webcamRef.current.srcObject = stream; setWebcamActive(true); } })
      .catch(e => { setWebcamError('Camera denied: ' + e.message); setWebcamActive(false); });
    return () => { webcamRef.current?.srcObject?.getTracks().forEach(t => t.stop()); };
  }, [sourceMode]);

  // ── Draw loop ──
  // ─── Draw loop ─────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const raw  = rawCanvasRef.current;
    const proc = procCanvasRef.current;
    if (!raw || !proc) return;
    const W = raw.width, H = raw.height;
    const rCtx = raw.getContext('2d');
    const pCtx = proc.getContext('2d');

    // Helper to draw grid lines on a canvas context
    const drawGridLines = (ctx) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      // Vertical rules
      ctx.moveTo(W / 3, 0); ctx.lineTo(W / 3, H);
      ctx.moveTo((2 * W) / 3, 0); ctx.lineTo((2 * W) / 3, H);
      // Horizontal rules
      ctx.moveTo(0, H / 3); ctx.lineTo(W, H / 3);
      ctx.moveTo(0, (2 * H) / 3); ctx.lineTo(W, (2 * H) / 3);
      ctx.stroke();
      ctx.restore();
    };

    // Helper to apply White Balance Warm/Cool tints
    const applyWhiteBalance = (ctx) => {
      if (cameraWb === 'auto') return;
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      if (cameraWb === 'warm') {
        ctx.fillStyle = 'rgba(255, 195, 125, 0.09)';
      } else if (cameraWb === 'cool') {
        ctx.fillStyle = 'rgba(125, 195, 255, 0.09)';
      } else if (cameraWb === 'daylight') {
        ctx.fillStyle = 'rgba(255, 255, 205, 0.06)';
      } else if (cameraWb === 'cloudy') {
        ctx.fillStyle = 'rgba(225, 205, 185, 0.08)';
      }
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    };

    // Helper to apply simulated ISO sensor grain/static
    const applyIsoNoise = (ctx) => {
      if (cameraIso <= 100) return;
      const intensity = ((cameraIso - 100) / 1500) * 0.08;
      const imgData = ctx.getImageData(0, 0, W, H);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 255 * intensity;
        data[i]     = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    };

    // Helper to draw digital image spreads with dynamic scrolling & hardware zooming
    const drawDigitalSource = (ctx, pageNum, imgDataRef) => {
      if (imgDataRef && imgDataRef.current) {
        const img = imgDataRef.current;
        const iW = img.naturalWidth || img.width;
        const iH = img.naturalHeight || img.height;

        const pct = totalPages && totalPages > 1 ? (pageNum - 1) / (totalPages - 1) : 0;
        const canvasAspect = H / W;
        const imgAspect = iH / iW;

        // Seeded per-page brightness variation (subtle realism)
        const brt = (0.94 + ((pageNum * 7) % 17) / 100).toFixed(3);
        const ctr = (0.97 + ((pageNum * 11) % 8) / 100).toFixed(3);
        ctx.filter = `brightness(${brt}) contrast(${ctr})`;

        // Digital hardware zoom calculations
        const cropW = iW / cameraZoom;
        const cropH = iH / cameraZoom;
        const cropX = (iW - cropW) / 2;
        const cropY = (iH - cropH) / 2;

        if (imgAspect > canvasAspect) {
          const visH = Math.floor(cropW * canvasAspect);
          const maxY = cropH - visH;
          const srcY = Math.round(pct * maxY);
          ctx.drawImage(img, cropX, cropY + srcY, cropW, visH, 0, 0, W, H);
        } else {
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, W, H);
        }
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(148,163,184,0.35)';
        ctx.font = '13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No Source', W / 2, H / 2);
      }
    };

    // Helper to draw technical scan targets
    const drawPlaceholder = (ctx, label) => {
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(148,163,184,0.25)';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, H / 2);
    };

    // Apply CV corrections pipeline
    const applyCVPipeline = (ctx) => {
      if (alpha !== 1.0 || beta !== 0) {
        const id = ctx.getImageData(0, 0, W, H);
        ctx.putImageData(applyAlphaBeta(id, alpha, beta), 0, 0);
      }
      if (filter !== 'none') {
        const id = ctx.getImageData(0, 0, W, H);
        let out;
        if      (filter === 'grayscale')          out = applyGrayscale(id);
        else if (filter === 'adaptive_threshold') out = applyAdaptiveThreshold(applyGrayscale(id), W, H, 7, delta);
        else if (filter === 'high_contrast')      out = applyContrast(applyGrayscale(id), contrast);
        if (out) ctx.putImageData(out, 0, 0);
      }
      if (gamma !== 1.0) {
        const id = ctx.getImageData(0, 0, W, H);
        ctx.putImageData(applyGammaCorrection(id, gamma), 0, 0);
      }
      if (stylerActive) {
        const id = ctx.getImageData(0, 0, W, H);
        ctx.putImageData(applyPaperColorizer(id, stylerBg, stylerTxt, stylerTolerance, stylerBrightness, stylerInkThresh, stylerInkStrength), 0, 0);
      }
    };

    // ── MAIN SPLIT DRAW SELECTIONS ──
    if (scanMethod === 'raw_processed') {
      // METHOD 1: One Side Raw Image, Other Side Theme Settings Applied
      if (sourceMode === 'webcam' && webcamRef.current && webcamActive) {
        rCtx.filter = 'none';
        rCtx.save();
        const zW = webcamRef.current.videoWidth / cameraZoom;
        const zH = webcamRef.current.videoHeight / cameraZoom;
        const zX = (webcamRef.current.videoWidth - zW) / 2;
        const zY = (webcamRef.current.videoHeight - zH) / 2;
        rCtx.drawImage(webcamRef.current, zX, zY, zW, zH, 0, 0, W, H);
        rCtx.restore();
      } else {
        drawDigitalSource(rCtx, mockPageNumber, imgRef);
      }
      applyWhiteBalance(rCtx);
      applyIsoNoise(rCtx);
      if (gridlinesActive) drawGridLines(rCtx);

      if (totalPages) {
        const label = `Page ${mockPageNumber} / ${totalPages}`;
        rCtx.save();
        rCtx.font = 'bold 16px monospace';
        rCtx.textAlign = 'right';
        const tw = rCtx.measureText(label).width;
        rCtx.fillStyle = 'rgba(2,6,23,0.82)';
        rCtx.fillRect(W - tw - 22, H - 34, tw + 16, 26);
        rCtx.fillStyle = maxReached ? '#f87171' : '#fbbf24';
        rCtx.fillText(label, W - 10, H - 14);
        rCtx.restore();
      }

      // Draw Right Processed Viewport
      pCtx.drawImage(raw, 0, 0, W, H);
      applyCVPipeline(pCtx);

    } else {
      // METHOD 2: Left is Page Even, Right is Page Odd (Dual Scan)
      const leftPageNum = (mockPageNumber % 2 === 0) ? mockPageNumber : (mockPageNumber - 1);
      const rightPageNum = (mockPageNumber % 2 !== 0) ? mockPageNumber : (mockPageNumber + 1);

      // 1. Draw Left Viewport (Page Even)
      if (leftPageNum === 0) {
        drawPlaceholder(rCtx, 'CAM-1: LEFT PAGE (INACTIVE)');
      } else {
        if (sourceMode === 'webcam' && webcamRef.current && webcamActive) {
          rCtx.save();
          // split webcam: draw left 50%
          const vW = webcamRef.current.videoWidth / 2;
          const vH = webcamRef.current.videoHeight;
          const zW = vW / cameraZoom;
          const zH = vH / cameraZoom;
          const zX = (vW - zW) / 2;
          const zY = (vH - zH) / 2;
          rCtx.drawImage(webcamRef.current, zX, zY, zW, zH, 0, 0, W, H);
          rCtx.restore();
        } else {
          drawDigitalSource(rCtx, leftPageNum, leftImgRef);
        }
        applyWhiteBalance(rCtx);
        applyIsoNoise(rCtx);
        applyCVPipeline(rCtx);
        if (gridlinesActive) drawGridLines(rCtx);

        // draw left page index tag
        rCtx.save();
        rCtx.font = 'bold 16px monospace';
        rCtx.fillStyle = 'rgba(2,6,23,0.85)';
        rCtx.fillRect(10, H - 34, 110, 26);
        rCtx.fillStyle = '#fbbf24';
        rCtx.fillText(`Page ${leftPageNum}`, 18, H - 14);
        rCtx.restore();
      }

      // 2. Draw Right Viewport (Page Odd)
      if (sourceMode === 'webcam' && webcamRef.current && webcamActive) {
        pCtx.save();
        // split webcam: draw right 50%
        const vW = webcamRef.current.videoWidth / 2;
        const vH = webcamRef.current.videoHeight;
        const zW = vW / cameraZoom;
        const zH = vH / cameraZoom;
        const zX = vW + (vW - zW) / 2;
        const zY = (vH - zH) / 2;
        pCtx.drawImage(webcamRef.current, zX, zY, zW, zH, 0, 0, W, H);
        pCtx.restore();
      } else {
        drawDigitalSource(pCtx, rightPageNum, rightImgRef);
      }
      applyWhiteBalance(pCtx);
      applyIsoNoise(pCtx);
      applyCVPipeline(pCtx);
      if (gridlinesActive) drawGridLines(pCtx);

      // draw right page index tag
      pCtx.save();
      pCtx.font = 'bold 16px monospace';
      pCtx.fillStyle = 'rgba(2,6,23,0.85)';
      pCtx.fillRect(W - 120, H - 34, 110, 26);
      pCtx.fillStyle = '#fbbf24';
      pCtx.fillText(`Page ${rightPageNum}`, W - 110, H - 14);
      pCtx.restore();
    }

    // ── Simulated flash burst trigger overlay ──
    if (triggerFlashEffect) {
      rCtx.save(); rCtx.fillStyle = 'rgba(255,255,255,0.92)'; rCtx.fillRect(0,0,W,H); rCtx.restore();
      pCtx.save(); pCtx.fillStyle = 'rgba(255,255,255,0.92)'; pCtx.fillRect(0,0,W,H); pCtx.restore();
    }

  }, [sourceMode, webcamActive, imgLoaded, filter, contrast, alpha, beta, gamma, delta, mockPageNumber, totalPages, maxReached, scanMethod, cameraZoom, cameraAspect, cameraIso, cameraWb, gridlinesActive, cameraFlash, triggerFlashEffect, stylerActive, stylerBg, stylerTxt, stylerTolerance, stylerBrightness, stylerInkThresh, stylerInkStrength]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawFrame]);

  // ── Capture ──
  const handleCapture = useCallback(() => {
    if (maxReached) return;

    // Trigger flash animation
    if (cameraFlash === 'on' || cameraFlash === 'torch') {
      setTriggerFlashEffect(true);
      setTimeout(() => setTriggerFlashEffect(false), 140);
    }

    const raw  = rawCanvasRef.current;
    const proc = procCanvasRef.current;
    if (!raw || !proc) return;
    
    const t0 = performance.now();
    const format = imageFormat;
    const quality = format === 'image/jpeg' ? 0.88 : undefined;
    const typeLabel = format === 'image/png' ? 'PNG' : 'JPEG';
    
    const leftPageNum = (mockPageNumber % 2 === 0) ? mockPageNumber : (mockPageNumber - 1);
    const rightPageNum = (mockPageNumber % 2 !== 0) ? mockPageNumber : (mockPageNumber + 1);

    if (scanMethod === 'raw_processed') {
      // Single Page Capture
      const dataUrl = proc.toDataURL(format, quality);
      setCapturedPages(prev => {
        if (retakeIndex !== null && retakeIndex < prev.length) {
          const next = [...prev];
          next[retakeIndex] = { dataUrl, page: retakeIndex + 1, filter, format: typeLabel };
          return next;
        }
        return [...prev, { dataUrl, page: prev.length + 1, filter, format: typeLabel }];
      });
      if (totalPages) setMockPageNumber(p => p < totalPages ? p + 1 : p);
      setRetakeIndex(null);
    } else {
      // DUAL BOOK SCANNING SPREAD CAPTURE
      if (leftPageNum === 0) {
        // First spread: capture only Right (Page 1)
        const rightData = proc.toDataURL(format, quality);
        setCapturedPages(prev => {
          if (retakeIndex !== null && retakeIndex < prev.length) {
            const next = [...prev];
            next[retakeIndex] = { dataUrl: rightData, page: rightPageNum, filter, format: typeLabel };
            return next;
          }
          return [...prev, { dataUrl: rightData, page: rightPageNum, filter, format: typeLabel }];
        });
        if (totalPages) setMockPageNumber(2);
        setRetakeIndex(null);
      } else {
        // Spreads 2+: capture both Left (even) and Right (odd) at once
        const leftData = raw.toDataURL(format, quality);
        const rightData = proc.toDataURL(format, quality);
        setCapturedPages(prev => {
          if (retakeIndex !== null) {
            const next = [...prev];
            const leftIdx = leftPageNum - 1;
            const rightIdx = rightPageNum - 1;
            if (leftIdx < next.length) next[leftIdx] = { dataUrl: leftData, page: leftPageNum, filter, format: typeLabel };
            if (rightIdx < next.length) next[rightIdx] = { dataUrl: rightData, page: rightPageNum, filter, format: typeLabel };
            return next;
          }
          const next = [...prev];
          next.push({ dataUrl: leftData, page: leftPageNum, filter, format: typeLabel });
          next.push({ dataUrl: rightData, page: rightPageNum, filter, format: typeLabel });
          return next;
        });
        if (totalPages) setMockPageNumber(p => p < totalPages ? Math.min(totalPages, p + 2) : p);
        setRetakeIndex(null);
      }
    }

    const t1 = performance.now();
    const elapsedSec = (t1 - t0) / 1000;
    
    setTelemetry(prev => ({
      ...prev,
      captureFormat: typeLabel,
      captureTime: elapsedSec
    }));

    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 280);
  }, [maxReached, retakeIndex, filter, totalPages, imageFormat, scanMethod, mockPageNumber, cameraFlash]);

  // ── Keyboard ──
  useEffect(() => {
    const handle = (e) => {
      if (!user) return;
      const tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space')      { e.preventDefault(); if (!maxReached) handleCapture(); }
      if (e.code === 'Escape')     { setRetakeIndex(null); setDrawerOpen(false); }
      if (e.code === 'ArrowRight') { 
        e.preventDefault(); 
        setMockPageNumber(p => totalPages ? Math.min(totalPages, p + (scanMethod === 'dual_book' ? 2 : 1)) : p); 
      }
      if (e.code === 'ArrowLeft')  { 
        e.preventDefault(); 
        setMockPageNumber(p => Math.max(1, p - (scanMethod === 'dual_book' ? 2 : 1))); 
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [user, handleCapture, maxReached, totalPages, scanMethod]);

  const processPageWithStyler = (page) => {
    if (!stylerActive) return Promise.resolve(page.dataUrl);
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = page.dataUrl;
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        try {
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const styledImgData = applyPaperColorizer(
            imgData,
            stylerBg,
            stylerTxt,
            stylerTolerance,
            stylerBrightness,
            stylerInkThresh,
            stylerInkStrength
          );
          ctx.putImageData(styledImgData, 0, 0);
          const mime = page.format === 'PNG' ? 'image/png' : 'image/jpeg';
          const quality = page.format === 'PNG' ? undefined : 0.88;
          resolve(tempCanvas.toDataURL(mime, quality));
        } catch (e) {
          console.error("Failed to style page dynamically:", e);
          resolve(page.dataUrl);
        }
      };
      img.onerror = () => resolve(page.dataUrl);
    });
  };

  const deletePage  = (i) => {
    setCapturedPages(prev => prev.filter((_, j) => j !== i).map((p, j) => ({ ...p, page: j + 1 })));
    if (retakeIndex === i) setRetakeIndex(null);
  };
  const startRetake = (i) => {
    setRetakeIndex(i);
    if (totalPages) setMockPageNumber(capturedPages[i]?.page ?? mockPageNumber);
  };

  // ── Compile PDF ──
  const compile = async () => {
    if (!capturedPages.length) return;
    setProgress({ pct: 0, msg: 'Initializing PDF…' });
    const tCompileStart = performance.now();
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pW  = pdf.internal.pageSize.getWidth();
    const pH  = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < capturedPages.length; i++) {
      if (i > 0) pdf.addPage();
      setProgress({ pct: Math.round(((i + 1) / capturedPages.length) * 80), msg: `Compiling page ${i + 1}…` });
      const pageFormat = capturedPages[i].format || 'JPEG';
      const styledDataUrl = await processPageWithStyler(capturedPages[i]);
      pdf.addImage(styledDataUrl, pageFormat, 0, 0, pW, pH, undefined, 'FAST');
    }
    const tCompileEnd = performance.now();
    const compileElapsed = (tCompileEnd - tCompileStart) / 1000;
    setTelemetry(prev => ({
      ...prev,
      pdfCompileTime: compileElapsed
    }));

    setProgress({ pct: 90, msg: 'Uploading…' });
    const tUploadStart = performance.now();
    try {
      const blob  = pdf.output('blob');
      const fname = `scan_S001_${Date.now()}.pdf`;
      const fd    = new FormData(); fd.append('pdf', blob, fname);
      const res   = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: fd });
      const data  = await res.json();
      const tUploadEnd = performance.now();
      const uploadElapsed = (tUploadEnd - tUploadStart) / 1000;
      setTelemetry(prev => ({
        ...prev,
        uploadTime: uploadElapsed
      }));
      setProgress({ pct: 100, msg: data.success ? '✅ Upload successful!' : `⚠️ ${data.message}` });
      if (data.success) {
        setHistory(prev => [{
          name: fname,
          pages: capturedPages.length,
          time: new Date().toLocaleTimeString(),
          status: 'complete',
          pdfUrl: data.pdfUrl
        }, ...prev]);
        fetchTree();
      }
    } catch (err) {
      const tUploadEnd = performance.now();
      const uploadElapsed = (tUploadEnd - tUploadStart) / 1000;
      setTelemetry(prev => ({
        ...prev,
        uploadTime: uploadElapsed
      }));
      pdf.save(`scan_booklet_${Date.now()}.pdf`);
      setProgress({ pct: 100, msg: '✅ Downloaded locally.' });
    }
    setTimeout(() => setProgress(null), 3500);
  };

  const handleDownloadFormat = async (format) => {
    if (!capturedPages.length) return;
    const t0 = performance.now();
    
    if (format === 'PDF') {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pW  = pdf.internal.pageSize.getWidth();
      const pH  = pdf.internal.pageSize.getHeight();
      for (let i = 0; i < capturedPages.length; i++) {
        if (i > 0) pdf.addPage();
        const pageFormat = capturedPages[i].format || 'JPEG';
        const styledDataUrl = await processPageWithStyler(capturedPages[i]);
        pdf.addImage(styledDataUrl, pageFormat, 0, 0, pW, pH, undefined, 'FAST');
      }
      pdf.save(`scanned_booklet_${Date.now()}.pdf`);
      const t1 = performance.now();
      const elapsed = (t1 - t0) / 1000;
      setTelemetry(prev => ({
        ...prev,
        downloadTimePdf: elapsed
      }));
    } else if (format === 'JPEG' || format === 'PNG') {
      const lastPage = capturedPages[capturedPages.length - 1];
      if (!lastPage) return;
      
      const link = document.createElement('a');
      link.download = `scanned_page_${lastPage.page}_${Date.now()}.${format.toLowerCase()}`;
      
      const styledDataUrl = await processPageWithStyler(lastPage);
      
      if (lastPage.format === format && !stylerActive) {
        link.href = lastPage.dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const img = new window.Image();
        img.src = styledDataUrl;
        await new Promise((resolve) => {
          img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const mime = format === 'JPEG' ? 'image/jpeg' : 'image/png';
            const quality = format === 'JPEG' ? 0.88 : undefined;
            link.href = tempCanvas.toDataURL(mime, quality);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            resolve();
          };
        });
      }
      const t1 = performance.now();
      const elapsed = (t1 - t0) / 1000;
      setTelemetry(prev => ({
        ...prev,
        [format === 'JPEG' ? 'downloadTimeJpeg' : 'downloadTimePng']: elapsed
      }));
    }
  };

  const fetchUploadedPdfs = async () => {
    try {
      const r = await fetch(`${BASE_URL}/api/uploads/list`);
      const d = await r.json();
      if (d.success && d.list) setUploadedPdfs(d.list);
    } catch (err) {
      console.error('Error fetching uploaded PDFs list:', err);
    }
  };

  const fetchTree = async () => {
    setTL(true);
    try {
      const r = await fetch(`${BASE_URL}/api/documents`);
      const d = await r.json();
      if (d.success && d.folders) setTree(d.folders);
    } catch {}
    setTL(false);
  };

  useEffect(() => {
    if (user) {
      fetchTree();
      fetchUploadedPdfs();
    }
  }, [user]);

  if (!user) return <AuthScreen onLogin={setUser} />;

  const retaking    = retakeIndex !== null;
  const filterLabel = FILTERS.find(f => f.id === filter)?.label ?? '';

  // ── Button style helpers ──
  const tabBtn = (active, grad) => ({
    flex: 1, padding: '0.42rem', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.18s',
    background: active ? grad : 'rgba(255,255,255,0.05)',
    color: active ? 'white' : 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  });
  const navBtn = (disabled) => ({
    flex: 1, padding: '0.36rem', background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)', color: disabled ? 'var(--text-secondary)' : 'white',
    borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 4, fontSize: '0.72rem', opacity: disabled ? 0.38 : 1, transition: 'opacity 0.15s',
  });

  return (
    <>
      {/* ═══ HEADER ═══ */}
      <header className="scanstation-header">
        <div className="brand-section">
          <div className="brand-logo">⚡</div>
          <div className="brand-title">
            <h1>Examic ScanStation</h1>
            <span className="brand-subtitle">
              {sourceMode === 'webcam' ? '📷 Live Camera' : `📄 ${sample?.label}`}
            </span>
          </div>
        </div>
        <div className="header-status">
          {retaking   && <div className="status-badge" style={{ borderColor:'var(--neon-amber)', color:'var(--neon-amber)' }}><AlertCircle size={12}/> Retake P{retakeIndex+1}</div>}
          {maxReached && <div className="status-badge" style={{ borderColor:'var(--neon-red)',   color:'var(--neon-red)'   }}>MAX {totalPages}p</div>}
          <div className="status-badge"><div className={`status-dot ${isScanning?'pulsing':''}`}/>{isScanning?'SCANNING':'READY'}</div>
          <div className="status-badge"><Wifi size={12} color="var(--neon-green)"/> {user.name}</div>
        </div>
      </header>

      {/* ═══ MAIN GRID ═══ */}
      <div className="dashboard-grid">

        {/* ── LEFT COLUMN ── */}
        <div className="left-column">

          {/* Source Panel */}
          <div className="panel-card">
            <div className="panel-title"><Monitor size={14}/> Source</div>
            <div style={{ display:'flex', gap:'0.4rem', marginBottom:'0.75rem' }}>
              <button style={tabBtn(sourceMode==='digital','linear-gradient(135deg,#a855f7,#3b82f6)')} onClick={()=>setSourceMode('digital')}><Monitor size={13}/> Digital</button>
              <button style={tabBtn(sourceMode==='webcam', 'linear-gradient(135deg,#10b981,#3b82f6)')} onClick={()=>setSourceMode('webcam')}><Camera  size={13}/> Webcam</button>
            </div>

            {sourceMode === 'digital' && (
              <select className="control-select" value={sampleId} onChange={e=>setSampleId(e.target.value)}>
                {allSamples.map(s=><option key={s.id} value={s.id}>{s.label}  ({s.pages}p)</option>)}
              </select>
            )}

            {sourceMode === 'webcam' && (
              <div style={{ fontSize:'0.78rem', padding:'0.42rem 0.6rem', borderRadius:6, marginBottom:'0.5rem',
                background: webcamActive?'rgba(74,222,128,0.08)':'rgba(248,113,113,0.08)',
                border:`1px solid ${webcamActive?'rgba(74,222,128,0.25)':'rgba(248,113,113,0.25)'}`,
                color: webcamActive?'var(--neon-green)':'var(--neon-red)' }}>
                {webcamActive ? '● Camera active — Live feed' : webcamError || '⏳ Requesting camera…'}
              </div>
            )}
            {/* Capture & Export Format options */}
            <div style={{ marginTop: '0.75rem', padding: '0.65rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: '0 0 0.45rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>📸 Scan &amp; Export Config</p>
              
              {/* Image Format Select */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Format</span>
                <select className="control-select" style={{ margin: 0, width: '58%', padding: '0.2rem 0.4rem', height: 'auto', fontSize: '0.72rem' }}
                        value={imageFormat} onChange={e => setImageFormat(e.target.value)}>
                  <option value="image/jpeg">JPEG (Compressed)</option>
                  <option value="image/png">PNG (Lossless)</option>
                </select>
              </div>

              {/* Allow Extra Pages Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Allow Extra Pages</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={allowExtraPages} onChange={e => setAllowExtraPages(e.target.checked)}
                         style={{ accentColor: 'var(--neon-purple)', cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.68rem', color: allowExtraPages ? 'var(--neon-purple)' : 'var(--text-secondary)', fontWeight: allowExtraPages ? 700 : 400 }}>
                    {allowExtraPages ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>
            {/* Page Navigator */}
            {totalPages && (
              <div style={{ marginBottom:'0.75rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.42rem 0.7rem',
                  background: maxReached?'rgba(248,113,113,0.08)':'rgba(251,191,36,0.08)',
                  border:`1px solid ${maxReached?'rgba(248,113,113,0.25)':'rgba(251,191,36,0.2)'}`,
                  borderRadius:8, marginBottom:'0.4rem' }}>
                  <BookOpen size={13} color={maxReached?'var(--neon-red)':'var(--neon-amber)'}/>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', flex:1 }}>Page</span>
                  <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:'0.95rem',
                    color: maxReached?'var(--neon-red)':'var(--neon-amber)' }}>
                    {mockPageNumber}<span style={{ color:'var(--text-secondary)', fontWeight:400 }}> / {totalPages}</span>
                  </span>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button style={navBtn(mockPageNumber<=1)} onClick={()=>setMockPageNumber(p=>Math.max(1,p-1))} disabled={mockPageNumber<=1}>
                    <ArrowLeft size={11}/> Prev
                  </button>
                  <button style={navBtn(mockPageNumber>=totalPages)} onClick={()=>setMockPageNumber(p=>Math.min(totalPages,p+1))} disabled={mockPageNumber>=totalPages}>
                    Next <ArrowRight size={11}/>
                  </button>
                </div>
              </div>
            )}

            {/* Capture button */}
            <button className="glass-button" onClick={handleCapture} disabled={maxReached}
              style={{ width:'100%',
                background: maxReached?'rgba(148,163,184,0.15)':retaking?'linear-gradient(135deg,#f59e0b,#ef4444)':undefined,
                cursor: maxReached?'not-allowed':'pointer',
                color: maxReached?'var(--text-secondary)':undefined }}>
              <ScanLine size={15}/>
              {maxReached ? `All ${totalPages} pages captured` : retaking ? `Retake Page ${retakeIndex+1}` : 'Capture  (Space)'}
            </button>
            {retaking && (
              <button onClick={()=>setRetakeIndex(null)} style={{ width:'100%', marginTop:'0.4rem', background:'transparent', border:'1px solid var(--border-color)', color:'var(--text-secondary)', borderRadius:8, padding:'0.36rem', cursor:'pointer', fontSize:'0.72rem' }}>
                Cancel Retake  (Esc)
              </button>
            )}
          </div>

          {/* Inline CV tuning controls (moved from viewport overlays to sidebar with mobile dial scrolling) */}
          <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minHeight: 0 }}>
            <div className="panel-title" style={{ justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sliders size={14} color="var(--neon-purple)" /> CV Tuning Studio
              </span>
              <button onClick={() => { setAlpha(1.0); setBeta(0); setGamma(1.0); setDelta(5); setContrast(30); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.72rem' }}>
                Reset
              </button>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem', marginBottom: '0.15rem' }}>
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  style={{
                    padding: '0.35rem 0.2rem', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                    border: `1px solid ${filter === f.id ? 'var(--neon-purple)' : 'var(--border-color)'}`,
                    background: filter === f.id ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: filter === f.id ? 'var(--neon-purple)' : 'var(--text-secondary)',
                    fontSize: '0.65rem', fontWeight: filter === f.id ? 700 : 400, transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1
                  }}>
                  <span>{f.icon}</span>
                  <span style={{ fontSize: '0.58rem' }}>{f.label}</span>
                </button>
              ))}
            </div>

            {/* Scrollable horizontal dial carousel selector */}
            <div className="tuning-tabs-scroll" style={{
              display: 'flex', gap: '0.35rem', overflowX: 'auto',
              paddingBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}>
              {[
                { id: 'alpha', symbol: 'α', name: 'Exposure', icon: <Sun size={11} /> },
                { id: 'beta', symbol: 'β', name: 'Shadows', icon: <Sliders size={11} /> },
                { id: 'gamma', symbol: 'γ', name: 'Gamma', icon: <Zap size={11} /> },
                { id: 'delta', symbol: 'δ', name: 'Detail', icon: <Target size={11} /> },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveProTab(t.id)}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
                    padding: '0.22rem 0.45rem', borderRadius: 12, cursor: 'pointer',
                    fontSize: '0.68rem', border: '1px solid var(--border-color)',
                    background: activeProTab === t.id ? 'var(--neon-purple)' : 'rgba(255,255,255,0.03)',
                    color: activeProTab === t.id ? 'white' : 'var(--text-secondary)',
                    fontWeight: activeProTab === t.id ? 700 : 400, transition: 'all 0.15s'
                  }}>
                  {t.icon} <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{t.symbol}</span> <span style={{ fontSize: '0.62rem' }}>{t.name}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Slider Dial Content */}
            <div style={{ padding: '0.45rem 0.6rem', background: 'rgba(192,132,252,0.03)', border: '1px solid rgba(192,132,252,0.12)', borderRadius: 8, minHeight: '52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {activeProTab === 'alpha' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.15rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><Sun size={11} color="var(--neon-purple)"/> α Exposure (Gain)</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--neon-amber)', fontWeight: 'bold' }}>{alpha.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.5" max="2.5" step="0.05" value={alpha} onChange={e => updateAlpha(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--neon-purple)', height: 3 }} />
                </div>
              )}

              {activeProTab === 'beta' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.15rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><Sliders size={11} color="var(--neon-purple)"/> β Shadow (Bias)</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--neon-amber)', fontWeight: 'bold' }}>{beta >= 0 ? '+' : ''}{beta}</span>
                  </div>
                  <input type="range" min="-80" max="80" step="1" value={beta} onChange={e => updateBeta(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--neon-purple)', height: 3 }} />
                </div>
              )}

              {activeProTab === 'gamma' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.15rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><Zap size={11} color="var(--neon-purple)"/> γ Contrast (Curve)</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--neon-amber)', fontWeight: 'bold' }}>{gamma.toFixed(1)}</span>
                  </div>
                  <input type="range" min="0.3" max="3.0" step="0.1" value={gamma} onChange={e => updateGamma(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--neon-purple)', height: 3 }} />
                </div>
              )}

              {activeProTab === 'delta' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.15rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><Target size={11} color="var(--neon-purple)"/> δ Detail (Threshold)</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--neon-amber)', fontWeight: 'bold' }}>{delta}</span>
                  </div>
                  <input type="range" min="1" max="30" step="1" value={delta} onChange={e => updateDelta(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--neon-purple)', height: 3 }} />
                </div>
              )}
            </div>

            {/* Contrast Boost (if high_contrast mode is active) */}
            {filter === 'high_contrast' && (
              <div style={{ padding: '0.4rem 0.5rem', background: 'rgba(192,132,252,0.03)', border: '1px solid rgba(192,132,252,0.12)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem', fontSize: '0.68rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Contrast Boost</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--neon-amber)' }}>{contrast}</span>
                </div>
                <input type="range" min="0" max="128" value={contrast} onChange={e => setContrast(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--neon-purple)', height: 3 }} />
              </div>
            )}
          </div>

          {/* Pro Camera Hardware Control Deck */}
          <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={14} color="var(--neon-blue)" /> Pro Camera Cockpit
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--neon-green)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                ACTIVE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {/* Zoom Control */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.15rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🔍 Digital Zoom</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--neon-amber)', fontWeight: 'bold' }}>{cameraZoom.toFixed(1)}x</span>
                </div>
                <input type="range" min="1.0" max="3.0" step="0.1" value={cameraZoom} onChange={e => setCameraZoom(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--neon-blue)', height: 3 }} />
              </div>

              {/* Viewfinder Aspect Ratio */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>📐 Aspect Ratio</span>
                <select className="control-select" style={{ margin: 0, width: '50%', padding: '0.15rem 0.35rem', fontSize: '0.7rem', height: 'auto' }}
                        value={cameraAspect} onChange={e => setCameraAspect(e.target.value)}>
                  <option value="A4">A4 Document (1:1.41)</option>
                  <option value="4:3">4:3 Viewfinder</option>
                  <option value="16:9">16:9 Widescreen</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </div>

              {/* White Balance Tint */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>☀️ White Balance</span>
                <select className="control-select" style={{ margin: 0, width: '50%', padding: '0.15rem 0.35rem', fontSize: '0.7rem', height: 'auto' }}
                        value={cameraWb} onChange={e => setCameraWb(e.target.value)}>
                  <option value="auto">Auto Balance</option>
                  <option value="warm">Warm Tint (3000K)</option>
                  <option value="cool">Cool Tint (8000K)</option>
                  <option value="daylight">Daylight (5500K)</option>
                  <option value="cloudy">Cloudy Shadow</option>
                </select>
              </div>

              {/* Sensor Gain (ISO) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>🎚️ Sensor ISO</span>
                <select className="control-select" style={{ margin: 0, width: '50%', padding: '0.15rem 0.35rem', fontSize: '0.7rem', height: 'auto' }}
                        value={cameraIso} onChange={e => setCameraIso(Number(e.target.value))}>
                  <option value="100">ISO 100 (Clean)</option>
                  <option value="200">ISO 200</option>
                  <option value="400">ISO 400</option>
                  <option value="800">ISO 800 (Grainy)</option>
                  <option value="1600">ISO 1600 (Noise)</option>
                </select>
              </div>

              {/* Hardware Gridlines & Flash */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.15rem' }}>
                {/* Rule of Thirds Gridlines */}
                <button onClick={() => setGridlinesActive(!gridlinesActive)}
                  style={{
                    padding: '0.35rem 0.2rem', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                    border: `1px solid ${gridlinesActive ? 'var(--neon-blue)' : 'var(--border-color)'}`,
                    background: gridlinesActive ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: gridlinesActive ? 'var(--neon-blue)' : 'var(--text-secondary)',
                    fontSize: '0.65rem', fontWeight: gridlinesActive ? 700 : 400, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                  }}>
                  <Zap size={11} /> Gridlines: {gridlinesActive ? 'ON' : 'OFF'}
                </button>

                {/* Simulated Flash Toggle */}
                <button onClick={() => setCameraFlash(f => f === 'off' ? 'on' : f === 'on' ? 'torch' : 'off')}
                  style={{
                    padding: '0.35rem 0.2rem', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                    border: `1px solid ${cameraFlash !== 'off' ? 'var(--neon-amber)' : 'var(--border-color)'}`,
                    background: cameraFlash !== 'off' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: cameraFlash !== 'off' ? 'var(--neon-amber)' : 'var(--text-secondary)',
                    fontSize: '0.65rem', fontWeight: cameraFlash !== 'off' ? 700 : 400, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                  }}>
                  <Sun size={11} /> Flash: {cameraFlash.toUpperCase()}
                </button>
              </div>
            </div>
          </div>

          {/* Student Roster */}
          <div className="panel-card" style={{ display:'flex', flexDirection:'column' }}>
            <div className="panel-title" style={{ flexShrink:0 }}><FileCheck size={14}/> Roster</div>
            <div className="roster-list" style={{ overflowY:'auto' }}>
              {MOCK_ROSTER.map(s=>(
                <div key={s.id} className="roster-item">
                  <div className="roster-info">
                    <span className="roster-name">{s.name}</span>
                    <span className="roster-meta">{s.roll}</span>
                  </div>
                  <span className={`roster-status ${s.status}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN ── */}
        <div className="center-column">
          <div className="panel-card scanning-workspace">
            <div className="panel-title" style={{ flexShrink:0, justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ScanLine size={14}/> Scanning Workspace</span>
              
              {/* Method Dropdown Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>Scan Mode:</span>
                <select className="control-select" style={{ width: 'auto', margin: 0, padding: '0.2rem 0.5rem', fontSize: '0.72rem', height: 'auto', background: 'rgba(15,23,42,0.8)' }}
                        value={scanMethod} onChange={e => { setScanMethod(e.target.value); setCapturedPages([]); setMockPageNumber(1); }}>
                  <option value="raw_processed">RAW 📷 Processed (Theme Visualizer)</option>
                  <option value="dual_book">Left 📖 Right (Dual Book Spread)</option>
                </select>
              </div>
            </div>

            {/* Camera Grid — Aspect viewports */}
            <div className="camera-grid">
              {/* RAW */}
              <div className={`camera-viewport ${isScanning?'active':''}`} onClick={handleViewportClick} 
                   style={{ 
                     cursor: 'crosshair',
                     aspectRatio: cameraAspect === 'A4' ? '1 / 1.414' : cameraAspect === '4:3' ? '4 / 3' : cameraAspect === '16:9' ? '16 / 9' : '1 / 1'
                   }}>
                <div className="camera-label">
                  {scanMethod === 'dual_book' ? 'CAM-1 · LEFT PAGE' : 'CAM-1 · RAW INPUT'}
                </div>
                <div className="scanner-overlay"/>
                <div className="scanner-laser"/>
                <div className="scan-matrix-glow"/>
                <video ref={webcamRef} autoPlay muted playsInline className="camera-feed-webcam"
                  style={{ display: (sourceMode==='webcam' && scanMethod !== 'dual_book')?'block':'none' }}/>
                <canvas ref={rawCanvasRef} width={640} height={904} className="camera-feed-simulated"
                  style={{ display: (sourceMode==='webcam' && scanMethod !== 'dual_book')?'none':'block' }}/>
                {isScanning && <div style={{ position:'absolute', inset:0, background:'rgba(96,165,250,0.15)', zIndex:20, pointerEvents:'none' }}/>}
                
                {focusRing && (
                  <div className="camera-focus-ring" style={{ left: focusRing.x, top: focusRing.y }} />
                )}
              </div>

              {/* PROCESSED */}
              <div className={`camera-viewport ${isScanning?'active':''}`} onClick={handleViewportClick} 
                   style={{ 
                     cursor: 'crosshair',
                     aspectRatio: cameraAspect === 'A4' ? '1 / 1.414' : cameraAspect === '4:3' ? '4 / 3' : cameraAspect === '16:9' ? '16 / 9' : '1 / 1'
                   }}>
                <div className="camera-label" style={{ color:'var(--neon-green)' }}>
                  {scanMethod === 'dual_book' ? 'CAM-2 · RIGHT PAGE' : `CAM-2 · ${filterLabel.toUpperCase()}`}
                </div>
                <div className="scanner-overlay"/>
                <div className="edge-bounding-box"/>
                <div className="edge-bounding-box-ai" style={{ top: '8%', left: '8%', right: '8%', bottom: '8%' }} />
                
                {/* HUD Corner Accents */}
                <div className="hud-corner hud-corner-tl" />
                <div className="hud-corner hud-corner-tr" />
                <div className="hud-corner hud-corner-bl" />
                <div className="hud-corner hud-corner-br" />
                
                <canvas ref={procCanvasRef} width={640} height={904} className="camera-feed-simulated"/>
                {isScanning && <div style={{ position:'absolute', inset:0, background:'rgba(74,222,128,0.12)', zIndex:20, pointerEvents:'none' }}/>}
                
                {focusRing && (
                  <div className="camera-focus-ring" style={{ left: focusRing.x, top: focusRing.y }} />
                )}

                {/* Floating Exposure/EV Tonal indicator */}
                {expIndicator && (
                  <div className="camera-exp-indicator">
                    <span className="camera-exp-icon">{expIndicator.icon}</span>
                    <span className="camera-exp-label">{expIndicator.label}</span>
                    <span className="camera-exp-val">{expIndicator.val}</span>
                  </div>
                )}

                {/* 🤖 Real-Time AI Enhancer & Quality Analyzer HUD */}
                <div className="camera-ai-hud" style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  zIndex: 10,
                  pointerEvents: 'none',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr', // Clean 2-column split prevents text overlap!
                  gap: '4px 8px',
                  fontSize: '0.62rem',
                  fontFamily: 'monospace',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <span className="hud-green-pulse" /> Focus: <span style={{ color: '#fff', fontWeight: 'bold' }}>STABLE ({aiMetrics.focus.toFixed(0)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <span className="hud-green-pulse" /> Exposure: <span style={{ color: '#fff', fontWeight: 'bold' }}>{(alpha * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <span className="hud-green-pulse" /> Skew: <span style={{ color: '#fff', fontWeight: 'bold' }}>{aiMetrics.skew.toFixed(2)}°</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <span className="hud-green-pulse" /> Shadow: <span style={{ color: '#fff', fontWeight: 'bold' }}>REDUCED ({beta >= 0 ? '+' : ''}{beta})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <span className="hud-green-pulse" /> Blur: <span style={{ color: '#fff', fontWeight: 'bold' }}>STABLE</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <span className="hud-green-pulse" /> OCR: <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>{aiMetrics.ocr.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Viewport is 100% clean and clear of permanent settings docks */}
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="shortcuts-legend" style={{ flexShrink:0 }}>
              <span className="shortcut-item"><kbd>Space</kbd> Capture</span>
              <span className="shortcut-item"><kbd>Esc</kbd> Cancel Retake</span>
              <span className="shortcut-item"><kbd>←</kbd><kbd>→</kbd> Browse</span>
              <span className="shortcut-item"><kbd>⚙</kbd> tap for settings</span>
            </div>

            {/* Progress */}
            {progress && (
              <div className="progress-panel" style={{ flexShrink:0, margin:'0.3rem 0' }}>
                <div className="progress-header">
                  <span>Compiling…</span>
                  <span style={{ color:'var(--neon-purple)' }}>{progress.pct}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width:`${progress.pct}%` }}/>
                </div>
                <span className="progress-status-txt">{progress.msg}</span>
              </div>
            )}

            {/* Booklet Builder */}
            <div className="booklet-builder" style={{ flexShrink:0 }}>
              <div className="booklet-title-row">
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <BookOpen size={13} color="var(--neon-purple)"/>
                  <span className="booklet-label">Booklet Builder</span>
                  {capturedPages.length>0 && (
                    <span style={{ fontFamily:'monospace', fontSize:'0.72rem', padding:'1px 6px', borderRadius:4,
                      color: maxReached?'var(--neon-red)':'var(--neon-purple)',
                      background: maxReached?'rgba(248,113,113,0.1)':'rgba(192,132,252,0.1)' }}>
                      {capturedPages.length}{totalPages?` / ${totalPages}`:''} pages
                    </span>
                  )}
                </div>
                {capturedPages.length>0 && (
                  <div style={{ display:'flex', gap:'0.45rem' }}>
                    <button onClick={()=>{setCapturedPages([]);setMockPageNumber(1);setRetakeIndex(null);}}
                      style={{ background:'transparent', border:'1px solid rgba(248,113,113,0.4)', color:'var(--neon-red)', borderRadius:6, padding:'0.22rem 0.5rem', cursor:'pointer', fontSize:'0.72rem', display:'flex', alignItems:'center', gap:3 }}>
                      <Trash2 size={11}/> Clear
                    </button>
                    <button onClick={() => handleDownloadFormat('PDF')} className="glass-button" style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: 'var(--neon-blue)', padding:'0.22rem 0.6rem', fontSize:'0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Download size={11}/> Download PDF
                    </button>
                    <button onClick={compile} className="glass-button" style={{ padding:'0.22rem 0.6rem', fontSize:'0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Upload size={11}/> Sync &amp; Save DB
                    </button>
                  </div>
                )}
              </div>
              {capturedPages.length===0
                ? <div className="builder-empty-state">Press Space to capture pages into the booklet</div>
                : (
                  <div className="captured-pages-row">
                    {capturedPages.map((pg,i)=>(
                      <div key={i} className="captured-page-thumbnail"
                        style={retakeIndex===i?{borderColor:'var(--neon-amber)',boxShadow:'0 0 8px rgba(251,191,36,0.4)'}:{}}>
                        <img src={pg.dataUrl} alt={`P${pg.page}`} className="captured-page-img"/>
                        <span className="captured-page-num">P{pg.page}</span>
                        <button className="delete-page-btn" onClick={()=>deletePage(i)} title="Delete">✕</button>
                        <button className="retake-page-btn" onClick={()=>startRetake(i)} title="Retake"><RotateCcw size={8}/></button>
                        <span className="retake-tooltip" onClick={()=>startRetake(i)}>Retake P{pg.page}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="right-column">
          {showRightSettings ? (
            <div className="panel-card" style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div className="panel-title" style={{ flexShrink:0, justifyContent:'space-between' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <Sliders size={14} color="var(--neon-purple)"/> CV Image Studio
                </span>
                <button onClick={()=>setShowRightSettings(false)} title="Close Panel"
                  style={{ background:'transparent', border:'1px solid var(--border-color)', color:'var(--text-secondary)', borderRadius:'50%', width:24, height:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={12}/>
                </button>
              </div>
              
              {/* Full Image Tuning Settings Suite */}
              <div className="custom-scrollbar" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.9rem', marginTop:'0.5rem', paddingRight:2 }}>
                {/* Info Badge */}
                <div style={{ padding:'0.45rem', background:'rgba(192,132,252,0.06)', border:'1px solid rgba(192,132,252,0.15)', borderRadius:8, fontSize:'0.7rem', color:'var(--text-secondary)' }}>
                  Tweak exposure, threshold details, and contrast corrections below to dynamically remove paper shadows.
                </div>

                {/* Filter Pill Selector */}
                <div>
                  <p style={{ fontSize:'0.68rem', color:'var(--text-secondary)', margin:'0 0 0.35rem', textTransform:'uppercase', letterSpacing:1 }}>Filter Mode</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                    {FILTERS.map(f => (
                      <button key={f.id} onClick={() => setFilter(f.id)}
                        style={{ padding:'0.5rem 0.35rem', borderRadius:8, cursor:'pointer', textAlign:'center',
                          border:`1.5px solid ${filter===f.id?'var(--neon-purple)':'var(--border-color)'}`,
                          background: filter===f.id?'rgba(192,132,252,0.15)':'rgba(255,255,255,0.04)',
                          color: filter===f.id?'var(--neon-purple)':'var(--text-secondary)',
                          fontSize:'0.74rem', fontWeight: filter===f.id?700:400, transition:'all 0.15s' }}>
                        <div style={{ fontSize:'1.1rem', marginBottom:'0.1rem' }}>{f.icon}</div>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contrast Boost (dynamic) */}
                {filter === 'high_contrast' && (
                  <div style={{ padding:'0.5rem', background:'rgba(192,132,252,0.06)', borderRadius:8, border:'1px solid rgba(192,132,252,0.15)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem', fontSize:'0.72rem' }}>
                      <span style={{ color:'var(--text-secondary)' }}>Contrast Boost</span>
                      <span style={{ fontFamily:'monospace', color:'var(--neon-amber)', fontWeight:'bold' }}>{contrast}</span>
                    </div>
                    <input type="range" min="0" max="128" value={contrast} onChange={e=>setContrast(Number(e.target.value))}
                      style={{ width:'100%', accentColor:'var(--neon-purple)', height:4 }} />
                  </div>
                )}

                {/* Exposure Dials */}
                <div>
                  <p style={{ fontSize:'0.68rem', color:'var(--text-secondary)', margin:'0 0 0.45rem', textTransform:'uppercase', letterSpacing:1 }}>Exposure &amp; Lighting Dials</p>
                  
                  {/* Alpha */}
                  <div style={{ marginBottom:'0.75rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'0.2rem' }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:3 }}><Sun size={11} color="var(--neon-purple)"/> α Exposure (Gain)</span>
                      <span style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--neon-amber)', fontWeight:'bold' }}>{alpha.toFixed(2)}</span>
                    </div>
                    <input type="range" min="0.5" max="2.5" step="0.05" value={alpha} onChange={e=>updateAlpha(Number(e.target.value))}
                      style={{ width:'100%', accentColor:'var(--neon-purple)', height:4 }} />
                  </div>

                  {/* Beta */}
                  <div style={{ marginBottom:'0.75rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'0.2rem' }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:3 }}><Sliders size={11} color="var(--neon-purple)"/> β Shadow Bias</span>
                      <span style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--neon-amber)', fontWeight: 'bold' }}>{beta >= 0 ? '+' : ''}{beta}</span>
                    </div>
                    <input type="range" min="-80" max="80" step="1" value={beta} onChange={e=>updateBeta(Number(e.target.value))}
                      style={{ width:'100%', accentColor:'var(--neon-purple)', height:4 }} />
                  </div>

                  {/* Gamma */}
                  <div style={{ marginBottom:'0.75rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'0.2rem' }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:3 }}><Zap size={11} color="var(--neon-purple)"/> γ Contrast (Curve)</span>
                      <span style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--neon-amber)', fontWeight:'bold' }}>{gamma.toFixed(1)}</span>
                    </div>
                    <input type="range" min="0.3" max="3.0" step="0.1" value={gamma} onChange={e=>updateGamma(Number(e.target.value))}
                      style={{ width:'100%', accentColor:'var(--neon-purple)', height:4 }} />
                  </div>

                  {/* Delta */}
                  <div style={{ marginBottom:'0.75rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'0.2rem' }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:3 }}><Target size={11} color="var(--neon-purple)"/> δ Detail (Threshold)</span>
                      <span style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--neon-amber)', fontWeight:'bold' }}>{delta}</span>
                    </div>
                    <input type="range" min="1" max="30" step="1" value={delta} onChange={e=>updateDelta(Number(e.target.value))}
                      style={{ width:'100%', accentColor:'var(--neon-purple)', height:4 }} />
                  </div>
                </div>

                {/* 🎨 Paper Color & Ink Styler */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', marginTop: '0.4rem' }}>
                  <PaperColorizer
                    inline={true}
                    active={stylerActive}
                    setActive={setStylerActive}
                    bgColor={stylerBg}
                    setBgColor={setStylerBg}
                    txtColor={stylerTxt}
                    setTxtColor={setStylerTxt}
                    tolerance={stylerTolerance}
                    setTolerance={setStylerTolerance}
                    brightness={stylerBrightness}
                    setBrightness={setStylerBrightness}
                    inkThresh={stylerInkThresh}
                    setInkThresh={setStylerInkThresh}
                    inkStrength={stylerInkStrength}
                    setInkStrength={setStylerInkStrength}
                  />
                </div>
              </div>

              {/* Reset & Apply Dials */}
              <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.4rem', flexShrink:0 }}>
                <button onClick={() => { setAlpha(1.0); setBeta(0); setGamma(1.0); setDelta(5); setContrast(30); }}
                  style={{ flex:1, padding:'0.4rem', background:'transparent', border:'1px solid var(--border-color)', color:'var(--text-secondary)', borderRadius:8, cursor:'pointer', fontSize:'0.72rem' }}>
                  Reset
                </button>
                <button className="glass-button" onClick={()=>setShowRightSettings(false)} style={{ flex:1, padding:'0.4rem', fontSize:'0.72rem' }}>
                  Close Panel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="panel-card" style={{ display:'flex', flexDirection:'column' }}>
                <div className="panel-title" style={{ flexShrink:0, justifyContent:'space-between' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><FolderOpen size={14}/> Storage</span>
                  <button onClick={fetchTree} style={{ background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'0.72rem', display:'flex', alignItems:'center', gap:3 }}>
                    <RotateCcw size={10}/> {treeLoading?'Loading…':'Refresh'}
                  </button>
                </div>
                <div className="explorer-tree" style={{ maxHeight: 280, overflowY:'auto' }}>
                  {tree.length===0
                    ? <span style={{ color:'var(--text-secondary)', fontSize:'0.75rem' }}>No folders yet. Upload a scan to populate.</span>
                    : <ExplorerTree nodes={tree} onSelectFile={handleSelectFile}/>}
                </div>
              </div>

              {/* 📊 Real-Time Telemetry & Benchmarks */}
              <div className="panel-card" style={{ background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Zap size={14} color="var(--neon-purple)" /> Real-Time Telemetry &amp; Benchmarks
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                  {/* Capture Telemetry */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>Last Capture Time</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Format: <strong style={{ color: telemetry.captureFormat === 'PNG' ? 'var(--neon-blue)' : 'var(--neon-amber)' }}>{telemetry.captureFormat}</strong></span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--neon-green)', fontWeight: 700 }}>
                      {telemetry.captureTime > 0 ? `${telemetry.captureTime.toFixed(3)}s` : '—'}
                    </span>
                  </div>

                  {/* PDF Compile Telemetry */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>PDF Compile Time</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>jsPDF page stitching</span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--neon-purple)', fontWeight: 700 }}>
                      {telemetry.pdfCompileTime > 0 ? `${telemetry.pdfCompileTime.toFixed(3)}s` : '—'}
                    </span>
                  </div>

                  {/* Est. Booklet Size Telemetry */}
                  {capturedPages.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: 'rgba(96,165,250,0.02)', border: '1px solid rgba(96,165,250,0.08)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>Est. Booklet Size</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Based on page compression</span>
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--neon-blue)', fontWeight: 700 }}>
                        {(capturedPages.length * 0.22).toFixed(2)} MB
                      </span>
                    </div>
                  )}

                  {/* Sync/Upload Network Telemetry */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>DB/Blob Sync Time</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Azure or local save</span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--neon-blue)', fontWeight: 700 }}>
                      {telemetry.uploadTime > 0 ? `${telemetry.uploadTime.toFixed(3)}s` : '—'}
                    </span>
                  </div>

                  {/* Downloading times for each format */}
                  <div style={{ marginTop: '0.25rem', padding: '0.5rem', background: 'rgba(168,85,247,0.03)', border: '1px solid rgba(168,85,247,0.1)', borderRadius: 8 }}>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: '0 0 0.45rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>💾 Format Download Benchmarks</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {/* JPEG Download */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button 
                          className="glass-button" 
                          onClick={() => handleDownloadFormat('JPEG')} 
                          disabled={!capturedPages.length}
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', height: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}
                        >
                          <Download size={10} /> Download JPEG
                        </button>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--neon-amber)' }}>
                          {telemetry.downloadTimeJpeg > 0 ? `${telemetry.downloadTimeJpeg.toFixed(3)}s` : '—'}
                        </span>
                      </div>

                      {/* PNG Download */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button 
                          className="glass-button" 
                          onClick={() => handleDownloadFormat('PNG')} 
                          disabled={!capturedPages.length}
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', height: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}
                        >
                          <Download size={10} /> Download PNG
                        </button>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--neon-blue)' }}>
                          {telemetry.downloadTimePng > 0 ? `${telemetry.downloadTimePng.toFixed(3)}s` : '—'}
                        </span>
                      </div>

                      {/* PDF Download */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button 
                          className="glass-button" 
                          onClick={() => handleDownloadFormat('PDF')} 
                          disabled={!capturedPages.length}
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', height: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}
                        >
                          <Download size={10} /> Download PDF
                        </button>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--neon-purple)' }}>
                          {telemetry.downloadTimePdf > 0 ? `${telemetry.downloadTimePdf.toFixed(3)}s` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel-card" style={{ display:'flex', flexDirection:'column' }}>
                <div className="panel-title" style={{ flexShrink:0, justifyContent:'space-between' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><BookOpen size={14} color="var(--neon-purple)"/> Uploaded Booklets (DB)</span>
                  <button onClick={fetchUploadedPdfs} style={{ background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'0.72rem' }}>
                    <RotateCcw size={10}/> Refresh
                  </button>
                </div>
                <div className="custom-scrollbar" style={{ maxHeight: 200, overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.45rem', marginTop:'0.35rem' }}>
                  {uploadedPdfs.length === 0 ? (
                    <p style={{ color:'var(--text-secondary)', fontSize:'0.75rem', margin:0 }}>No uploaded PDF booklets found in database.</p>
                  ) : (
                    uploadedPdfs.map((pdf, idx) => (
                      <div key={pdf._id || idx} className="history-item" style={{ padding: '0.45rem 0.5rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handleSelectUploadedPdf(pdf)}
                                title="Click to Load Booklet into Scanner Viewport">
                            {pdf.filename}
                          </span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                            {new Date(pdf.uploadedAt || pdf.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <a href={pdf.pdfUrl} target="_blank" rel="noopener noreferrer"
                           style={{ padding: '0.2rem 0.4rem', borderRadius: 4, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: 'var(--neon-purple)', fontSize: '0.65rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                          <Monitor size={10}/> Open
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-title"><Clock size={14}/> History</div>
                {history.length===0
                  ? <p style={{ color:'var(--text-secondary)', fontSize:'0.75rem', margin:0 }}>No scans compiled yet.</p>
                  : (
                    <div className="history-list">
                      {history.map((h,i)=>(
                        <div key={i} className="history-item">
                          <div className="history-details">
                            <span className="history-name">{h.name}</span>
                            <span className="history-meta">{h.pages}p · {h.time}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {h.pdfUrl && (
                              <a href={h.pdfUrl} target="_blank" rel="noopener noreferrer"
                                 style={{ padding: '0.2rem 0.45rem', borderRadius: 4, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--neon-green)', fontSize: '0.65rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                                 title="Open Scanned Compiled PDF">
                                <Monitor size={10}/> Open
                              </a>
                            )}
                            <span className={`roster-status ${h.status}`}>{h.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ MOBILE SETTINGS FAB ═══ */}
      <button className="settings-fab" onClick={()=>setShowRightSettings(true)} title="CV Settings  (α β γ δ) in Right Panel">
        <Settings size={22}/>
      </button>

      {/* ═══ SETTINGS BOTTOM DRAWER ═══ */}
      <SettingsDrawer
        open={drawerOpen}
        onClose={()=>setDrawerOpen(false)}
        filter={filter}   setFilter={setFilter}
        contrast={contrast} setContrast={setContrast}
        alpha={alpha}     setAlpha={updateAlpha}
        beta={beta}       setBeta={updateBeta}
        gamma={gamma}     setGamma={updateGamma}
        delta={delta}     setDelta={updateDelta}
      />
    </>
  );
}
