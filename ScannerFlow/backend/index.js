const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 6000;

app.use(cors());
app.use(express.json());

// Set up structured folder logic using Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create folder structure based on current date and a dummy batch
    const date = new Date().toISOString().split('T')[0];
    const uploadPath = path.join(__dirname, 'uploads', date, 'batch_1');
    
    // Ensure the folder exists before saving the PDF
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Add timestamp to ensure unique filenames
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// --- ENDPOINTS ---

// 1. Upload a PDF and create structured folder
app.post('/api/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No valid PDF uploaded' });
  }
  res.json({ 
    success: true, 
    message: 'PDF successfully uploaded and structured folder created!',
    file: req.file 
  });
});

// Helper function to recursively build a tree of the uploads directory
function getDirectoryTree(dirPath) {
  if (!fs.existsSync(dirPath)) return { name: 'uploads', children: [] };
  
  const stats = fs.statSync(dirPath);
  const info = {
    name: path.basename(dirPath),
    isDirectory: stats.isDirectory()
  };

  if (stats.isDirectory()) {
    info.children = fs.readdirSync(dirPath).map(child => {
      return getDirectoryTree(path.join(dirPath, child));
    });
  }

  return info;
}

// 2. Fetch the directory structure to display on the frontend
app.get('/api/documents', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const tree = getDirectoryTree(uploadsDir);
  // If the root uploads folder exists, it returns a tree, otherwise return an empty array
  res.json({ success: true, folders: tree.children ? [tree] : [] });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ScannerFlow Backend listening at http://localhost:${port}`);
});
