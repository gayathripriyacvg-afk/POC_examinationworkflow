import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Text } from 'react-konva';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, PenTool, Eraser, Square } from 'lucide-react';

export default function OSMViewer({ paperBgColor }) {
  const containerRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
  
  // Hardcoded dimensions for the viewer
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 1000;

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const exportPDF = async () => {
    if (!containerRef.current) return;
    try {
      // Use html2canvas to capture the entire layered container
      const canvas = await html2canvas(containerRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [CANVAS_WIDTH, CANVAS_HEIGHT]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      pdf.save('evaluated_answer_script.pdf');
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem', width: '100%', height: '100%', overflowY: 'auto' }}>
      
      {/* Mini-toolbar for Drawing & Export */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', position: 'sticky', top: '10px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={() => setTool('pen')} 
          style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tool === 'pen' ? 'var(--accent)' : 'transparent', color: tool === 'pen' ? '#fff' : 'var(--text-secondary)' }}
          title="Pen Tool"
        >
          <PenTool size={20} />
        </button>
        <button 
          onClick={() => setTool('eraser')} 
          style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tool === 'eraser' ? 'var(--accent)' : 'transparent', color: tool === 'eraser' ? '#fff' : 'var(--text-secondary)' }}
          title="Eraser Tool"
        >
          <Eraser size={20} />
        </button>
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
        <button 
          onClick={exportPDF} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Download size={18} /> Export PDF
        </button>
      </div>

      {/* The 3-Layer Container */}
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative', 
          width: CANVAS_WIDTH, 
          height: CANVAS_HEIGHT, 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          // Layer 1: The dynamic background color
          backgroundColor: paperBgColor || 'white',
          border: '1px solid var(--border)'
        }}
      >
        {/* Layer 2: The transparent Answer Script image */}
        {/* We use a placeholder image URL for the transparent script. Imagine a scanned transparent PNG here */}
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/4/41/Lorem_ipsum_text.png")',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.8,
            pointerEvents: 'none', // let clicks pass through to Konva
            zIndex: 1
          }}
        />

        {/* Layer 3: React-Konva Canvas for drawing annotations */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }}>
          <Stage 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <Layer>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.tool === 'eraser' ? paperBgColor : '#df0000'} // Eraser blends with bg
                  strokeWidth={line.tool === 'eraser' ? 20 : 3}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    line.tool === 'eraser' ? 'destination-out' : 'source-over'
                  }
                />
              ))}
            </Layer>
          </Stage>
        </div>

      </div>
    </div>
  );
}
