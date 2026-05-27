import { useState, useRef, useEffect, useCallback } from "react";

// ── Palette ────────────────────────────────────────────────────────────────
const BG_COLORS = [
  { c: "#ffffff", l: "White" },
  { c: "#fffef0", l: "Cream" },
  { c: "#fdf6e3", l: "Warm white" },
  { c: "#e8f4fb", l: "Sky blue" },
  { c: "#f0f7e6", l: "Mint" },
  { c: "#fcebd5", l: "Peach" },
  { c: "#f3e8ff", l: "Lavender" },
  { c: "#fce4ec", l: "Pink" },
  { c: "#e0f7fa", l: "Cyan" },
  { c: "#fff8e1", l: "Yellow" },
  { c: "#e8f5e9", l: "Green" },
  { c: "#ede7f6", l: "Purple" },
  { c: "#f5f5dc", l: "Beige" },
  { c: "#e3f2fd", l: "Pale blue" },
  { c: "#ffebee", l: "Rose" },
];

const TXT_COLORS = [
  { c: "#000000", l: "Black" },
  { c: "#000066", l: "Dark blue" },
  { c: "#1a237e", l: "Navy" },
  { c: "#1b5e20", l: "Dark green" },
  { c: "#b71c1c", l: "Dark red" },
  { c: "#4a148c", l: "Deep purple" },
  { c: "#e65100", l: "Dark orange" },
  { c: "#004d40", l: "Teal" },
  { c: "#37474f", l: "Dark gray" },
  { c: "#0d47a1", l: "Royal blue" },
  { c: "#880e4f", l: "Dark pink" },
  { c: "#33691e", l: "Olive" },
  { c: "#bf360c", l: "Burnt orange" },
  { c: "#006064", l: "Dark cyan" },
  { c: "#212121", l: "Off black" },
];

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function PaperColorizer({
  inline = false,
  active = false,
  setActive = () => {},
  bgColor = "#ffffff",
  setBgColor = () => {},
  txtColor = "#000066",
  setTxtColor = () => {},
  tolerance = 60,
  setTolerance = () => {},
  brightness = 180,
  setBrightness = () => {},
  inkThresh = 100,
  setInkThresh = () => {},
  inkStrength = 80,
  setInkStrength = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [hasImage, setHasImage] = useState(false);

  const origDataRef = useRef(null);
  const mainCanvasRef = useRef(null);
  const origCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const showStyler = inline || open;

  // ── Apply colors to canvas ────────────────────────────────────────────────
  const applyColor = useCallback(() => {
    if (!origDataRef.current || !mainCanvasRef.current) return;
    const cv = mainCanvasRef.current;
    const ctx = cv.getContext("2d");
    const src = origDataRef.current.data;
    const out = new ImageData(
      new Uint8ClampedArray(src),
      origDataRef.current.width,
      origDataRef.current.height
    );
    const d = out.data;
    const w = origDataRef.current.width;
    const h = origDataRef.current.height;
    const [nr, ng, nb] = hexToRgb(bgColor);
    const [tr, tg, tb] = hexToRgb(txtColor);

    // Sample brightest pixels to detect paper bg
    let rS = 0, gS = 0, bS = 0, cnt = 0;
    const step = Math.max(1, Math.floor((w * h) / 3000));
    for (let i = 0; i < src.length; i += step * 4) {
      const br = (src[i] + src[i + 1] + src[i + 2]) / 3;
      if (br > brightness) { rS += src[i]; gS += src[i + 1]; bS += src[i + 2]; cnt++; }
    }
    if (cnt === 0) {
      const mid = (Math.floor(h / 2) * w + Math.floor(w / 2)) * 4;
      rS = src[mid]; gS = src[mid + 1]; bS = src[mid + 2]; cnt = 1;
    }
    const bgR = rS / cnt, bgG = gS / cnt, bgB = bS / cnt;

    for (let i = 0; i < d.length; i += 4) {
      const pr = src[i], pg = src[i + 1], pb = src[i + 2];
      const lum = (pr + pg + pb) / 3;
      const dist = Math.sqrt((pr - bgR) ** 2 + (pg - bgG) ** 2 + (pb - bgB) ** 2);

      if (dist < tolerance && lum > brightness - 50) {
        const t = Math.max(0, Math.min(1, 1 - (dist / tolerance) * 0.3));
        d[i]     = Math.round(pr * (1 - t) + nr * t);
        d[i + 1] = Math.round(pg * (1 - t) + ng * t);
        d[i + 2] = Math.round(pb * (1 - t) + nb * t);
      } else if (lum < inkThresh) {
        const darkness = 1 - lum / inkThresh;
        const blend = darkness * (inkStrength / 100);
        d[i]     = Math.round(pr * (1 - blend) + tr * blend);
        d[i + 1] = Math.round(pg * (1 - blend) + tg * blend);
        d[i + 2] = Math.round(pb * (1 - blend) + tb * blend);
      }
    }
    ctx.putImageData(out, 0, 0);
  }, [bgColor, txtColor, tolerance, brightness, inkThresh, inkStrength]);

  useEffect(() => { if (hasImage) applyColor(); }, [applyColor, hasImage]);

  // ── Load image ────────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        [origCanvasRef, mainCanvasRef].forEach((ref) => {
          if (ref.current) { ref.current.width = img.width; ref.current.height = img.height; }
        });
        origCanvasRef.current.getContext("2d").drawImage(img, 0, 0);
        const ctx = mainCanvasRef.current.getContext("2d");
        ctx.drawImage(img, 0, 0);
        origDataRef.current = ctx.getImageData(0, 0, img.width, img.height);
        setHasImage(true);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!mainCanvasRef.current) return;
    const a = document.createElement("a");
    a.download = (fileName.replace(/\.[^.]+$/, "") || "paper") + "_styled.png";
    a.href = mainCanvasRef.current.toDataURL("image/png");
    a.click();
  };

  // ── Swatch row ────────────────────────────────────────────────────────────
  const SwatchRow = ({ colors, active, onPick, round }) =>
    colors.map((s) => (
      <button
        key={s.c}
        title={s.l}
        onClick={() => onPick(s.c)}
        style={{
          width: 18, height: 18, borderRadius: round ? "50%" : 4,
          background: s.c, border: active === s.c ? "2px solid var(--neon-purple)" : "1px solid rgba(255,255,255,0.15)",
          cursor: "pointer", flexShrink: 0, outline: "none",
          boxShadow: active === s.c ? "0 0 5px var(--neon-purple)" : "none",
          transition: "transform .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.18)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      />
    ));

  // ── Slider ────────────────────────────────────────────────────────────────
  const Slider = ({ label, value, min, max, onChange, suffix = "" }) => (
    <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}>
      <span style={{ fontSize: 11, color: "var(--text-secondary)", minWidth: 90 }}>{label}</span>
      <input
        type="range" min={min} max={max} value={value} step={1}
        onChange={e => onChange(+e.target.value)}
        style={{ flex: 1, accentColor: "var(--neon-purple)", cursor: "pointer", height: 3 }}
      />
      <span style={{ fontSize: 11, color: "var(--neon-amber)", minWidth: 28, fontFamily: "monospace", textAlign: "right" }}>{value}{suffix}</span>
    </div>
  );

  // ── Panel section ─────────────────────────────────────────────────────────
  const Section = ({ label, children }) => (
    <div style={{
      background: "rgba(15, 23, 42, 0.4)", borderRadius: 10, padding: "8px 10px",
      border: "1px solid var(--border-color)", marginBottom: 6,
    }}>
      <div style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </div>
      {children}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating trigger button — place next to your settings gear — ONLY in float mode */}
      {!inline && (
        <button
          onClick={() => setOpen(o => !o)}
          title="Paper Color Styler"
          style={{
            position: "fixed", bottom: 24, right: 80,
            width: 48, height: 48, borderRadius: "50%",
            background: open ? "var(--neon-purple)" : "#1e1b4b",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            color: "#c4b5fd", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: open ? "0 0 16px rgba(168, 85, 247, 0.4)" : "0 2px 12px rgba(0,0,0,0.5)",
            transition: "all .2s", zIndex: 9999,
            fontSize: 20,
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = "#312e81"; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = "#1e1b4b"; }}
        >
          🎨
        </button>
      )}

      {/* Styler Panel */}
      {showStyler && (
        <div style={inline ? {
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          boxSizing: "border-box",
        } : {
          position: "fixed", bottom: 82, right: 16,
          width: 420, maxHeight: "82vh", overflowY: "auto",
          background: "var(--card-bg)", backdropFilter: "blur(16px)",
          border: "1px solid var(--border-color)",
          borderRadius: 16, padding: 14, zIndex: 9998,
          boxShadow: "var(--glass-shadow)",
          fontFamily: "'Outfit', sans-serif",
          color: "var(--text-primary)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--neon-purple)", letterSpacing: "0.05em" }}>
                  🎨 PAPER COLOR &amp; INK STYLER
                </span>
                
                {/* Modern sliding switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, color: active ? 'var(--neon-purple)' : 'var(--text-secondary)' }}>
                    {active ? 'ON' : 'OFF'}
                  </span>
                  <button
                    onClick={() => setActive(!active)}
                    title="Toggle Styler Filter"
                    style={{
                      width: 28,
                      height: 14,
                      borderRadius: 7,
                      background: active ? 'var(--neon-purple)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid ' + (active ? 'var(--neon-purple)' : 'rgba(255,255,255,0.2)'),
                      position: 'relative',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.2s',
                      outline: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: 1,
                        left: active ? 15 : 1,
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                      }}
                    />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 2 }}>
                {inline ? "Apply styling filters directly to live scanner & PDF compiles" : "Custom styling filters for loaded images"}
              </div>
            </div>
            {!inline && (
              <button onClick={() => setOpen(false)} style={{
                background: "none", border: "none", color: "var(--text-secondary)",
                fontSize: 18, cursor: "pointer", lineHeight: 1,
              }}>✕</button>
            )}
          </div>

          {/* Upload */}
          <Section label="Source Image">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="glass-button"
                style={{
                  padding: "4px 10px", fontSize: "0.68rem", height: "auto"
                }}
              >
                ↑ Select Image
              </button>
              <span style={{ fontSize: 10, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {fileName || "No file chosen"}
              </span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </div>
          </Section>

          {/* BG Color */}
          <Section label="Paper Background Color">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8, alignItems: "center" }}>
              <SwatchRow colors={BG_COLORS} active={bgColor} onPick={setBgColor} round={false} />
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                title="Custom Color" style={{ width: 18, height: 18, borderRadius: 4, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", padding: 1, background: "rgba(15, 23, 42, 0.4)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Slider label="Tolerance" value={tolerance} min={5} max={150} onChange={setTolerance} />
              <Slider label="Brightness cut" value={brightness} min={80} max={255} onChange={setBrightness} />
            </div>
          </Section>

          {/* Text Color */}
          <Section label="Ink / Text Color">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8, alignItems: "center" }}>
              <SwatchRow colors={TXT_COLORS} active={txtColor} onPick={setTxtColor} round={true} />
              <input type="color" value={txtColor} onChange={e => setTxtColor(e.target.value)}
                title="Custom Ink" style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", padding: 1, background: "rgba(15, 23, 42, 0.4)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Slider label="Ink threshold" value={inkThresh} min={20} max={180} onChange={setInkThresh} />
              <Slider label="Intensity" value={inkStrength} min={0} max={100} onChange={setInkStrength} suffix="%" />
            </div>
          </Section>

          {/* Preview */}
          {hasImage && (
            <Section label="Render Previews">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <canvas ref={origCanvasRef} style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border-color)" }} />
                  <div style={{ fontSize: 9, color: "var(--text-secondary)", textAlign: "center", marginTop: 4 }}>Original</div>
                </div>
                <div>
                  <canvas ref={mainCanvasRef} style={{ width: "100%", borderRadius: 8, border: "1px solid var(--neon-purple)" }} />
                  <div style={{ fontSize: 9, color: "var(--neon-purple)", textAlign: "center", marginTop: 4 }}>Processed</div>
                </div>
              </div>
            </Section>
          )}

          {/* Hidden canvas when no image yet */}
          {!hasImage && (
            <>
              <canvas ref={origCanvasRef} style={{ display: "none" }} />
              <canvas ref={mainCanvasRef} style={{ display: "none" }} />
            </>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!hasImage}
            className="glass-button"
            style={{
              width: "100%", padding: "7px 0",
              background: hasImage ? "linear-gradient(135deg, var(--neon-purple), var(--neon-blue))" : "rgba(255,255,255,0.02)",
              border: "1px solid " + (hasImage ? "var(--neon-purple)" : "var(--border-color)"),
              color: hasImage ? "#fff" : "var(--text-secondary)",
              fontSize: "0.72rem", cursor: hasImage ? "pointer" : "not-allowed",
              letterSpacing: "0.05em", fontWeight: 600,
              transition: "opacity .2s", height: "auto", margin: "4px 0"
            }}
          >
            ↓ DOWNLOAD STYLED IMAGE
          </button>
        </div>
      )}
    </>
  );
}