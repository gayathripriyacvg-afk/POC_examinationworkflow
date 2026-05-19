# Super Admin Flow Guide

This guide explains how to start the `SuperAdminFlow` frontend and backend, and how to verify that the login authentication works.

## 1. Starting the Backend Server
The backend handles the MongoDB connection and provides the `/api/login` endpoint.
1. Open a new terminal.
2. Navigate to the backend directory:
   ```bash
   cd d:\Scanner_Flow_Pocs\SuperAdminFlow\backend
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *You should see output indicating it is listening on port `5000` and connected to MongoDB.*

## 2. Starting the Frontend Server
The frontend provides the UI for the login page.
1. Open another new terminal.
2. Navigate to the frontend directory:
   ```bash
   cd d:\Scanner_Flow_Pocs\SuperAdminFlow\frontend
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *You should see output indicating it is running on `http://localhost:5173` and exposed on your local network IP.*

## 3. Testing the Login Flow
1. Open your web browser.
2. Navigate to [http://localhost:5173](http://localhost:5173).
3. You will see the **Super Admin Login** screen.
4. Enter the test credentials:
   - **Username:** `superadmin`
   - **Password:** `password123`
5. Click **Login**.
6. **Expected Result:** The UI should dynamically change to the Dashboard view, displaying "Success! Welcome back, superadmin".
