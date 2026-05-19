import React, { useState, useRef, useEffect } from 'react';
import OSMViewer from './OSMViewer';
import { 
  Sidebar, 
  Palette, 
  ArrowLeftToLine, 
  ArrowRightToLine, 
  ArrowUpToLine, 
  ArrowDownToLine,
  Sun, Moon, BookOpen
} from 'lucide-react';

export default function OSMDashboard({ theme, setTheme }) {
  const [showSynoptic, setShowSynoptic] = useState(false);
  const [toolbarPos, setToolbarPos] = useState('left');
  const [paperBgColor, setPaperBgColor] = useState('#ffffff');
  const [leftWidth, setLeftWidth] = useState(25); // percentage
  const isDragging = useRef(false);

  // Responsive dynamic styling for the toolbar
  const getToolbarStyle = () => {
    const base = { 
      display: 'flex', 
      background: 'var(--toolbar-bg)', 
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--border)', 
      zIndex: 50,
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      transition: 'all 0.3s ease'
    };
    if (toolbarPos === 'left' || toolbarPos === 'right') {
      return { 
        ...base, 
        flexDirection: 'column', 
        height: '100vh', 
        width: '80px', 
        padding: '2rem 0' 
      };
    }
    return { 
      ...base, 
      flexDirection: 'row', 
      width: '100vw', 
      height: '70px', 
      padding: '0 2rem' 
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 15 && newWidth < 85) setLeftWidth(newWidth);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const IconButton = ({ icon: Icon, onClick, active, title, color }) => (
    <button 
      onClick={onClick} 
      title={title}
      className="icon-btn"
      style={{
        padding: '12px',
        borderRadius: '12px',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : color || 'var(--text-secondary)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
      }}
    >
      <Icon size={24} />
    </button>
  );

  const Toolbar = () => (
    <div style={getToolbarStyle()}>
      
      {/* Toggle Synoptic View */}
      <IconButton 
        icon={Sidebar} 
        onClick={() => setShowSynoptic(!showSynoptic)} 
        active={showSynoptic} 
        title="Toggle Marking Scheme" 
      />

      <div style={toolbarPos === 'left' || toolbarPos === 'right' ? { width: '40px', height: '1px', background: 'var(--border)' } : { height: '40px', width: '1px', background: 'var(--border)' }} />

      {/* Toolbar Docking Controls */}
      <div style={{ display: 'flex', flexDirection: toolbarPos === 'left' || toolbarPos === 'right' ? 'column' : 'row', gap: '0.5rem' }}>
        <IconButton icon={ArrowLeftToLine} onClick={() => setToolbarPos('left')} active={toolbarPos === 'left'} title="Dock Left" />
        <IconButton icon={ArrowRightToLine} onClick={() => setToolbarPos('right')} active={toolbarPos === 'right'} title="Dock Right" />
        <IconButton icon={ArrowUpToLine} onClick={() => setToolbarPos('top')} active={toolbarPos === 'top'} title="Dock Top" />
        <IconButton icon={ArrowDownToLine} onClick={() => setToolbarPos('bottom')} active={toolbarPos === 'bottom'} title="Dock Bottom" />
      </div>

      <div style={toolbarPos === 'left' || toolbarPos === 'right' ? { width: '40px', height: '1px', background: 'var(--border)' } : { height: '40px', width: '1px', background: 'var(--border)' }} />

      {/* Theme Toggles (Alpha, Beta, Delta) */}
      <div style={{ display: 'flex', flexDirection: toolbarPos === 'left' || toolbarPos === 'right' ? 'column' : 'row', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '16px' }}>
        <IconButton icon={Sun} onClick={() => setTheme('alpha')} active={theme === 'alpha'} title="Alpha (Light Mode)" />
        <IconButton icon={Moon} onClick={() => setTheme('beta')} active={theme === 'beta'} title="Beta (Dark Mode)" />
        <IconButton icon={BookOpen} onClick={() => setTheme('delta')} active={theme === 'delta'} title="Delta (Reading Mode)" />
      </div>

      <div style={toolbarPos === 'left' || toolbarPos === 'right' ? { width: '40px', height: '1px', background: 'var(--border)' } : { height: '40px', width: '1px', background: 'var(--border)' }} />

      {/* Background Color Picker */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} title="Change Paper Texture/Color">
        <Palette size={24} color="var(--text-secondary)" />
        <input 
          type="color" 
          value={paperBgColor} 
          onChange={(e) => setPaperBgColor(e.target.value)} 
          style={{ width: '32px', height: '32px', border: '2px solid var(--border)', borderRadius: '50%', cursor: 'pointer', padding: 0, overflow: 'hidden' }}
        />
      </div>

    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: (toolbarPos === 'top' || toolbarPos === 'bottom') ? 'column' : 'row', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
      
      {(toolbarPos === 'left' || toolbarPos === 'top') && <Toolbar />}

      <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden', padding: '1rem', gap: '1rem' }}>
        
        {/* Synoptic Pane */}
        {showSynoptic && (
          <>
            <div className="glass" style={{ width: `${leftWidth}%`, height: '100%', borderRadius: '16px', padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Marking Scheme</h2>
              <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}>
                <p><strong>Q1:</strong> Discuss Newton's First Law. (2 marks)</p>
                <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />
                <p><strong>Q2:</strong> Ensure the chemical equation is balanced. (3 marks)</p>
                <div style={{ marginTop: '2rem' }}>
                  <a href="/OSM_Component.pdf" target="_blank" rel="noreferrer" style={{ color: 'white', background: 'var(--accent)', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold' }}>
                    Open PDF Reference
                  </a>
                </div>
              </div>
            </div>
            
            {/* Draggable Divider */}
            <div 
              onMouseDown={() => { isDragging.current = true; document.body.style.cursor = 'col-resize'; }}
              style={{ width: '12px', cursor: 'col-resize', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '6px' }}
              className="resizer-handle"
            >
              <div style={{ width: '4px', height: '50px', background: 'var(--border)', borderRadius: '4px' }} />
            </div>
          </>
        )}

        {/* Main OSM Viewer Canvas Area */}
        <div className="glass" style={{ width: showSynoptic ? `${100 - leftWidth}%` : '100%', height: '100%', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <OSMViewer paperBgColor={paperBgColor} />
        </div>

      </div>

      {(toolbarPos === 'right' || toolbarPos === 'bottom') && <Toolbar />}
    </div>
  );
}
