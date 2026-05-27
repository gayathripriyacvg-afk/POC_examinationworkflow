# Scanner Backend Architecture & Documentation

## 1. Module Overview
The **Scanner-Backend** is a highly optimized Node.js microservice responsible for receiving raw, cropped images from the frontend, normalizing them, stitching them into multi-page PDF documents, and pushing those documents securely into Microsoft Azure Cloud Storage. It also manages the synchronization of data from the main administrative databases.

## 2. Technology Stack & Core Libraries

### Server Framework
*   **Node.js & Express:** The core web server handling API routing and middleware.
*   **Morgan:** HTTP request logger for debugging.
*   **Cors:** Cross-Origin Resource Sharing middleware.
*   **Compression:** Gzip/Brotli compression for smaller API payloads.

### Database & Security
*   **Mongoose:** MongoDB Object Data Modeling (ODM) library. It maintains connections to `scanner_db`, `admin_db`, and `testplayer_db`.
*   **Bcryptjs:** Hashing passwords and sensitive strings.
*   **JSONWebToken (JWT):** Generating and verifying access tokens for secure API endpoints.

### Image & PDF Processing (The Heavy Lifters)
*   **Multer:** Middleware for handling `multipart/form-data`. This is how the backend receives the massive image files from the React frontend.
*   **Sharp (`sharp`):** High-performance image processing library written in C. Used to standardize image sizes, convert heavy PNGs to lightweight compressed JPEGs, and handle memory efficiently without crashing Node.js.
*   **PDF-Lib (`pdf-lib`):** Used to programmatically create a new PDF document and embed the processed JPEGs sequentially into its pages.
*   **JSQR (`jsqr`):** A fallback server-side QR code reader in case the frontend missed something or validation is required.

### Cloud Storage
*   **Azure Storage Blob (`@azure/storage-blob`):** Microsoft's official SDK for uploading the final PDFs and raw backup images into scalable cloud storage containers.

## 3. Data Flow & Trigger Events

### A. Data Synchronization Workflow
1.  **Trigger:** An Admin hits the "Sync" endpoint (`/api/sync/organizations/bulk`).
2.  **Flow:** The `DataSyncController` boots up. It reads the master data from `admin_db` and `testplayer_db`. It compares `updatedAt` timestamps and executes a massive `bulkWrite` into the local `scanner_db` collections (`users`, `courses`, `exams`).

### B. Image Ingestion & Processing
1.  **Trigger:** The frontend sends a POST request with an array of images.
2.  **Flow:** 
    *   `multer` catches the files and loads them into memory/disk.
    *   The backend spawns parallel `sharp` promises to compress and convert all images to JPEG simultaneously.
3.  **Trigger (PDF Generation):** Once images are ready.
4.  **Flow:** 
    *   `pdf-lib` creates a new `PDFDocument`.
    *   It loops through the JPEGs, adding a new page for each image.
    *   It finalizes the PDF as a byte array.

### C. Cloud Storage & Database Update
1.  **Flow (Upload):** The byte array is streamed to `@azure/storage-blob` using a secure connection string.
2.  **Flow (Persistence):** Once Azure returns a success URL, the backend updates the `scanned_scripts` collection in the `scanner_db` with the PDF URL and marks the student's paper as "Uploaded & Ready for Grading".
3.  **Flow (Feedback):** Sends a success status back to the frontend.
