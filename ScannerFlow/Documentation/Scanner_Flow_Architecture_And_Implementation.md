# ScannerFlow Architecture & Implementation Breakdown

This document provides a high-level explanation of the technologies and logic used to build the Examic ScanStation application. It is designed to help you explain the architecture and feature set to others without needing to dive deep into the codebase.

## 1. Core Framework & UI
- **Technology Used**: React (with Vite for fast bundling) and Vanilla CSS.
- **Why**: React provides the necessary state management (using hooks like `useState` and `useEffect`) required to manage multiple hardware camera feeds, complex UI states (dropdowns, themes), and real-time canvas manipulations simultaneously.
- **Responsiveness**: Handled purely via CSS Flexbox (`flex-wrap`) and CSS Grid, ensuring the application remains usable on smaller displays and tablets, dropping side-by-side elements down to stacked elements when screen width shrinks.

## 2. Dual Camera Hardware Setup
- **Technology Used**: HTML5 `<video>`, `<canvas>`, and `navigator.mediaDevices.enumerateDevices()`.
- **How it Works**: 
  - The application queries the operating system for all connected video hardware.
  - It filters out the first two available cameras and routes their live streams into two hidden HTML5 `<video>` elements.
  - Using `requestAnimationFrame`, the app constantly copies the pixels from the hidden videos onto visible HTML5 `<canvas>` elements (`canvasLeftRef` and `canvasRightRef`). 
  - **Advantage**: By routing the feed through a Canvas rather than just a Video tag, we gain the ability to manipulate the pixels in real-time (apply filters, draw bounding boxes, take snapshots) before the user even hits the capture button.

## 3. Computer Vision & Lighting Normalization (CV Themes)
- **Problem**: When scanning physical papers, lighting is rarely perfect (shadows from the user's arm, desk lamps, cheap hardware). Additionally, students use various instruments (dark blue pens vs. faint graphite pencils) which need to be balanced.
- **Technology Used**: CSS `filter` property pipeline (`brightness`, `contrast`, `saturate`, `sepia`, `grayscale`, `invert`).
- **How it Works**:
  - Instead of running computationally heavy OpenCV Python scripts on the backend (which causes severe latency), we apply highly-tuned CSS filter curves directly to the HTML5 Canvas in real-time.
  - For example, the **Omega (Mixed Media)** theme uses `contrast(1.5) brightness(0.85) saturate(1.2) grayscale(0.5)`. This specific math darkens faint graphite pencils (by dropping brightness and raising contrast) without "blowing out" or destroying already-dark pen ink.
  - The **Universal (All Inks)** theme uses an even more aggressive curve to pull data out of nearly invisible inks.

## 4. Hardware Simulation & Mocking (Digital Feed)
- **Problem**: Developers and stakeholders need to test the CV Themes and scanning workflow without having two physical webcams and a stack of badly lit exam papers on their desk.
- **Technology Used**: HTML5 Canvas (`drawImage`, `fillText`) and AI-generated static assets (`biology_good.png`, `biology_messy.png`, `mixed.png`).
- **How it Works**: 
  - When "Digital Mockup" or a specific sample is selected from the Source dropdown, the application disables the physical webcam stream.
  - It loads a high-resolution, realistic image into memory.
  - It slices the image in half horizontally (using `ctx.drawImage` cropping arguments) and streams the left half to Camera 1 and the right half to Camera 2, perfectly simulating an open 2-page booklet lying flat on a desk.
  - For the **32-Page Biology Mock**, the system overlays dynamic text (`fillText`) on top of the image to display `Page N / 32`. When the user hits the Space Bar, the page counter increments, simulating a user physically flipping the page of a thick booklet.

## 5. Rapid Client-Side PDF Generation
- **Problem**: Uploading 32 high-resolution JPEGs to a backend server to stitch them into a PDF takes too long and wastes bandwidth, breaking the user's request for "mili micro sec" export speed.
- **Technology Used**: `jspdf` (a client-side JavaScript PDF library).
- **How it Works**: 
  - When the user clicks "Save & Compile", the application does **not** send the images to the server.
  - Instead, it instantiates an empty PDF document entirely inside the browser's local memory.
  - It loops through the `capturedPages` array (the snapshots taken via the Space Bar) and injects them page-by-page directly into the local PDF blob.
  - It then forces the browser to instantly download/save the resulting optimized `.pdf` file. This entire process happens locally in milliseconds, completely bypassing network latency.

## 6. Non-Destructive Editing (Retake Logic)
- **Technology Used**: React State (`targetRetakeIndex`).
- **How it Works**: 
  - If a user notices a mistake on Page 4 after they've already scanned up to Page 20, they click "Retake" on the Page 4 thumbnail.
  - The application sets `targetRetakeIndex = 1` (since spread index 1 contains pages 3 and 4).
  - The next time the Space Bar is pressed, instead of appending the new snapshots to the end of the `capturedPages` array, the system overwrites the images at `targetRetakeIndex`.
  - It then immediately clears the `targetRetakeIndex`, returning the system to normal sequential scanning mode.
