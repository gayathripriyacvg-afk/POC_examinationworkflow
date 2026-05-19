const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const port = 5000;

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'ScannerSystemDB';

app.use(cors());
app.use(express.json());

let db;
MongoClient.connect(url)
  .then(client => {
    db = client.db(dbName);
    console.log(`Connected to MongoDB: ${dbName}`);
  })
  .catch(err => console.error('Failed to connect to MongoDB', err));

app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await db.collection('users').findOne({ username, password, role });
    if (user) {
      res.json({ success: true, message: 'Login successful', user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'SuperAdmin Backend is running' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`SuperAdmin Backend listening at http://localhost:${port}`);
});
