# Scanner Frontend Architecture & Documentation

## 1. Module Overview
The **Scanner-Frontend** is a React-based web application designed to capture physical exam answer scripts using a dual-camera hardware setup. It processes high-resolution video streams in real-time to auto-detect paper edges, crop the images, and send them to the backend for PDF compilation.

## 2. Technology Stack & Core Libraries

### UI & Styling Framework
*   **React 18 & Vite:** Lightning-fast frontend compilation and rendering.
*   **Tailwind CSS:** Utility-first CSS framework for rapid UI styling.
*   **Shadcn UI & Radix UI:** Accessible, unstyled UI components (Dialogs, Progress bars, Accordions, Tabs).
*   **Framer Motion:** High-performance animation library for smooth UI transitions.
*   **Lucide React:** Modern, lightweight SVG icons.

### State Management & Routing
*   **Redux Toolkit (`@reduxjs/toolkit`):** Global state management (e.g., currently active organization, user authentication, global scanner settings).
*   **TanStack React Query (`@tanstack/react-query`):** Handles asynchronous state, API data fetching, and caching (e.g., fetching exam rosters).
*   **React Router DOM v7:** Handles multi-page navigation within the SPA.

### Core Business Logic (The Heavy Lifters)
*   **OpenCV.js (`@techstark/opencv-js`):** A WebAssembly port of the powerful C++ computer vision library. Used for:
    *   Detecting paper contours (edges) against a desk background.
    *   Perspective warping (flattening an image if the camera is at an angle).
    *   Image filtering (enhancing contrast for pencil writing).
    *   *Note: This runs in background Web Workers to prevent the UI thread from freezing during intense math calculations.*
*   **QR Scanner (`qr-scanner` & `@zxing/library`):** Real-time decoding of QR codes printed on the physical answer sheets to identify the student and the exam.
*   **Axios:** HTTP client for sending the heavy, processed image blobs to the backend.

## 3. Data Flow & Trigger Events

### A. Initialization & Setup
1.  **Trigger:** User logs in and selects the Exam/Subject they are scanning today.
2.  **Flow:** React Query fetches the `test_schedule_records` and `roster` from the backend so the frontend knows exactly which students are expected to have papers today.

### B. The Scanning Loop
1.  **Trigger:** Operator presses `Q` (Keyboard Shortcut).
2.  **Flow:** The `qr-scanner` parses the video feed, finds the QR code, extracts the Student ID, and marks that student as "Present".
3.  **Trigger:** Operator places paper under cameras and presses `Spacebar`.
4.  **Flow:** 
    *   High-res snapshots are taken from both Left and Right webcams simultaneously.
    *   The images are passed to a **Web Worker**.
    *   **OpenCV.js** inside the worker detects the paper edges and crops out the desk.
    *   The cropped image blobs are saved temporarily in the browser's memory (or IndexedDB).

### C. Finalization
1.  **Trigger:** Operator finishes the booklet and presses `Ctrl+S`.
2.  **Flow:** 
    *   The frontend bundles all the processed image blobs.
    *   It uses `Axios` to POST a `multipart/form-data` payload to the `Scanner-Backend`.
    *   It listens to a Server-Sent Event (SSE) to display a real-time progress bar while the backend generates the PDF.
