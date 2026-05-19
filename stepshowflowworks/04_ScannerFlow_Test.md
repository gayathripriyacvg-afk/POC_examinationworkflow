# Scanner Flow Guide (Structured PDF Folders)

This guide explains how to test the end-to-end flow of uploading physical PDFs and having them automatically sorted into structured folders by the backend.

## 1. Starting the Backend Server
The backend utilizes `multer` to handle multi-part file uploads and file system routing.
1. Open a new terminal.
2. Navigate to the backend directory:
   ```bash
   cd d:\Scanner_Flow_Pocs\ScannerFlow\backend
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *You should see output indicating it is listening on port `6000`.*

## 2. Starting the Frontend Server
The frontend provides the dashboard for uploading and visualizing the storage tree.
1. Open another new terminal.
2. Navigate to the frontend directory:
   ```bash
   cd d:\Scanner_Flow_Pocs\ScannerFlow\frontend
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *You should see output indicating it is running on `http://localhost:5175`.*

## 3. Testing the End-to-End Flow
1. Open your web browser and navigate to [http://localhost:5175](http://localhost:5175).
2. The right panel ("Backend Storage tree") should indicate that no folders exist yet.

### 3.1 Uploading a PDF
1. In the left panel ("Upload PDF"), click **Choose File**.
2. Select any `.pdf` file from your local computer.
3. Click the blue **Upload to Server** button.

### 3.2 Verifying the Result
1. The UI will show a success message: "Upload successful! Structured folder created."
2. The right panel ("Backend Storage tree") will automatically refresh.
3. You will now see a visual tree representing your backend hard drive structure (e.g., `uploads` -> `2026-05-19` -> `batch_1` -> `your_file_name.pdf`).
4. **Physical Verification:** You can open your file explorer, go to `d:\Scanner_Flow_Pocs\ScannerFlow\backend\uploads`, and verify that the exact folder structure and the PDF file physically exist on your machine!
