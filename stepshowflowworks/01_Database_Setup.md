# Database Connection & Seeding Guide

This guide explains how to initialize your local MongoDB database with the required test credentials so that you can properly test authentication across all flows.

## 1. Prerequisites
- Ensure you have MongoDB installed and running locally on port `27017`.
- The default connection string used in this project is `mongodb://localhost:27017`.

## 2. The Seeding Script
We have provided a script named `seed_db.js` located in the root directory (`d:\Scanner_Flow_Pocs\`).
This script reads the dummy users from `static_logins.json` and inserts them into the `ScannerSystemDB` database under the `users` collection.

## 3. How to Run the Seeding Script
1. Open your terminal or command prompt.
2. Navigate to the root project directory:
   ```bash
   cd d:\Scanner_Flow_Pocs
   ```
3. Install the MongoDB driver if you haven't already:
   ```bash
   npm install mongodb
   ```
4. Execute the script:
   ```bash
   node seed_db.js
   ```

## 4. Expected Output
You should see the following success message in your terminal:
```
Connected successfully to MongoDB
Successfully inserted 4 users into the database.
Users inserted: [ 'superadmin', 'orgadmin', 'scanneruser', 'bookletscanner' ]
```

## 5. Verification
If you have a GUI like **MongoDB Compass**, you can open it, connect to `localhost:27017`, and look for the `ScannerSystemDB` database. Inside, you will see a `users` collection containing the 4 seeded documents.
