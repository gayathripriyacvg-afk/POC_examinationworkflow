# OSM Flow Guide (On-Screen Marking)

This guide explains how to start the `OSMFlow` frontend and thoroughly test all of the advanced UI features, including React-Konva layering and PDF export.

## 1. Starting the Frontend Server
The OSM Dashboard is currently entirely frontend-based for demonstration.
1. Open a new terminal.
2. Navigate to the frontend directory:
   ```bash
   cd d:\Scanner_Flow_Pocs\OSMFlow\frontend
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *You should see output indicating it is running on `http://localhost:5174`.*

## 2. Testing the UI Features
1. Open your web browser and navigate to [http://localhost:5174](http://localhost:5174).

### 2.1 Resizable Split-View
- Click the **Sidebar Icon** (first icon in the toolbar) to open the Synoptic/Marking Scheme pane.
- Hover your mouse over the vertical divider line between the two panes.
- Click and drag left or right to dynamically resize the panels.

### 2.2 Dynamic Toolbars
- Look for the dropdown menu in the toolbar (it says "⬅️ Left" by default).
- Click it and select "➡️ Right", "⬆️ Top", or "⬇️ Bottom".
- **Expected Result:** The entire layout adjusts automatically, docking the toolbar to the selected edge.

### 2.3 Multi-Theme Switcher
- Click the **α (Alpha)** button for Light Mode.
- Click the **β (Beta)** button for Dark Mode.
- Click the **δ (Delta)** button for Sepia Reading Mode.
- **Expected Result:** The global background colors, text colors, and glassmorphism panels update instantly.

### 2.4 React-Konva Drawing Engine
- Ensure the **Pen Tool** is selected in the floating mini-toolbar.
- Click and drag your mouse over the central canvas to draw red annotations.
- The drawing sits cleanly on top of the transparent text layer and the background color layer.
- Try changing the "Paper Background Color" using the color picker in the main toolbar. Notice how the drawing and the text remain unaffected while the background changes!

### 2.5 Export PDF
- Click the green **Export PDF** button in the floating mini-toolbar.
- **Expected Result:** A file named `evaluated_answer_script.pdf` will download to your machine. If you open it, it will perfectly replicate the background color, the text, and your drawn annotations.
