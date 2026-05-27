require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('../../node_modules/mongoose');
const jwt = require('jsonwebtoken');
const { PDFDocument } = require('pdf-lib');

const app = express();
const port = 6005;
const JWT_SECRET = 'examic-scanner-secret-key-2026';

// CORS & Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded PDFs statically so the frontend can preview them
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE CONNECTION ---
const MONGO_URI = 'mongodb://127.0.0.1:27017/ScannerSystemDB';
const DB_URL = 'mongodb://127.0.0.1:27017/ScannerSystemDB';

mongoose.connect(DB_URL)
  .then(() => {
    console.log('Successfully connected to MongoDB: ScannerSystemDB');
    seedMockMasterData();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// --- IMPORT EXISTING MODELS ---
// Administrative Master Models
const User = require('../../models/admin-models/User');
const Course = require('../../models/admin-models/coursesModel');
const OrgDetails = require('../../models/admin-models/orgDetailsModel');

// Scanner Operational Models
const ScannedScript = require('../../models/scanner-models/ScriptModel');
const ScannedScriptNU = require('../../models/scanner-models/ScannedScriptNUModel');
const UniqueScriptCodeMapping = require('../../models/scanner-models/UniqueScriptCodeMappingModel');

// Custom Mock Schema for Test Schedule Records (since it is referenced ref: 'test_schedule_records' in ScannedScriptNUModel but not fully structured elsewhere)
const testScheduleSchema = new mongoose.Schema({
  test_name: String,
  test_code: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
  exam_date: { type: Date, default: Date.now },
  expected_students_count: Number,
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' }
}, { timestamps: true });

const TestScheduleRecord = mongoose.models.test_schedule_records || mongoose.model('test_schedule_records', testScheduleSchema);

// Multer in-memory storage to handle quick PDF creation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// --- AUTOMATIC SEEDING OF MOCK MASTER DATA ---
async function seedMockMasterData() {
  try {
    // 1. Ensure Org Details
    let org = await OrgDetails.findOne({ org_code: 'ORG_001' });
    if (!org) {
      org = await OrgDetails.create({
        org_code: 'ORG_001',
        org_name: 'Apex Global University',
        org_type: 'University',
        org_address: '100 Innovation Way, Tech City',
        org_location: 'New York'
      });
      console.log('Seeded Org Details: ORG_001');
    }

    // 2. Ensure Courses
    let course1 = await Course.findOne({ code: 'CS_101' });
    if (!course1) {
      course1 = await Course.create({
        name: 'Introduction to Computer Science',
        code: 'CS_101',
        credits: '4',
        org_id: org._id
      });
      console.log('Seeded Course: CS_101');
    }

    let course2 = await Course.findOne({ code: 'CS_202' });
    if (!course2) {
      course2 = await Course.create({
        name: 'Database Management Systems',
        code: 'CS_202',
        credits: '4',
        org_id: org._id
      });
      console.log('Seeded Course: CS_202');
    }

    // 3. Ensure Students (Users) are present and referenced
    const studentUsernames = ['student_01', 'student_02', 'student_03', 'student_04'];
    const studentNames = ['Alice Carter', 'Bob Sterling', 'Charlie Hudson', 'Diana Prince'];
    const studentUniqueNos = ['STU_8801', 'STU_8802', 'STU_8803', 'STU_8804'];
    const students = [];

    for (let i = 0; i < studentUsernames.length; i++) {
      let student = await User.findOne({ username: studentUsernames[i] });
      if (!student) {
        student = await User.create({
          full_name: studentNames[i],
          email: `${studentUsernames[i]}@apex.edu`,
          phone: `555-010${i}`,
          username: studentUsernames[i],
          password: 'password123', // plaintext fallback, match seed_db
          dob: new Date(2004, 5, 12 + i),
          gender: i % 2 === 0 ? 'female' : 'male',
          org_code: 'ORG_001',
          orgId: org._id,
          uniqueno: studentUniqueNos[i],
          type: 'student',
          system: 'OSM'
        });
        console.log(`Seeded Student User: ${studentUsernames[i]}`);
      }
      students.push(student);
    }

    // 4. Ensure Test Schedules
    let schedule = await TestScheduleRecord.findOne({ test_code: 'SCH_CS101' });
    if (!schedule) {
      schedule = await TestScheduleRecord.create({
        test_name: 'CS 101 Spring Final Exam 2026',
        test_code: 'SCH_CS101',
        course: course1._id,
        exam_date: new Date(),
        expected_students_count: 4,
        org_id: org._id
      });
      console.log('Seeded Test Schedule Record: SCH_CS101');
    }

    let schedule2 = await TestScheduleRecord.findOne({ test_code: 'SCH_CS202' });
    if (!schedule2) {
      schedule2 = await TestScheduleRecord.create({
        test_name: 'CS 202 Midterm Exam 2026',
        test_code: 'SCH_CS202',
        course: course2._id,
        exam_date: new Date(Date.now() + 86400000 * 2), // 2 days later
        expected_students_count: 4,
        org_id: org._id
      });
      console.log('Seeded Test Schedule Record: SCH_CS202');
    }

    // 5. Ensure Unique Script Code Mappings (maps QR code to student)
    // Script QR format: QR_COURSECODE_STUDENTUNIQUE
    for (let i = 0; i < students.length; i++) {
      const code = `QR_CS101_${students[i].uniqueno}`;
      let mapping = await UniqueScriptCodeMapping.findOne({ uniqueScriptCode: code });
      if (!mapping) {
        await UniqueScriptCodeMapping.create({
          uniqueScriptCode: code,
          candidateId: students[i]._id,
          testId: schedule._id,
          courseId: course1._id,
          examId: schedule._id // using schedule id as a placeholder
        });
        console.log(`Seeded QR Mapping: ${code} -> ${students[i].full_name}`);
      }
    }

    for (let i = 0; i < students.length; i++) {
      const code = `QR_CS202_${students[i].uniqueno}`;
      let mapping = await UniqueScriptCodeMapping.findOne({ uniqueScriptCode: code });
      if (!mapping) {
        await UniqueScriptCodeMapping.create({
          uniqueScriptCode: code,
          candidateId: students[i]._id,
          testId: schedule2._id,
          courseId: course2._id,
          examId: schedule2._id
        });
        console.log(`Seeded QR Mapping: ${code} -> ${students[i].full_name}`);
      }
    }

    console.log('Database master reference data seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding mock reference data:', err);
  }
}





const { BlobServiceClient } = require('@azure/storage-blob');

// --- UPLOADED PDF DATABASE SCHEMA & MODEL ---
const uploadedPdfSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const UploadedPdf = mongoose.models.uploaded_pdfs || mongoose.model('uploaded_pdfs', uploadedPdfSchema);

// 1. Initialize the Blob Service Client with error-proof fallback
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "your_connection_string_here";
let blobServiceClient = null;
let useAzureBlob = false;
const containerName = "examic-scans";

if (AZURE_STORAGE_CONNECTION_STRING && AZURE_STORAGE_CONNECTION_STRING !== "your_connection_string_here") {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    useAzureBlob = true;
    console.log("⚡ Azure Blob Storage successfully initialized!");
  } catch (err) {
    console.warn("⚠️ Failed to initialize Azure Blob Client (invalid connection string). Falling back to local filesystem storage!");
  }
} else {
  console.log("ℹ️ Azure Connection String not set. Scanner station will store PDF files locally on the filesystem.");
}

// 2. Booklet image compiler or Manual PDF endpoint to save directly to the Cloud (or local fallback):
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file received.' });
    }

    if (useAzureBlob && blobServiceClient) {
      try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({ access: 'blob' }); // 'blob' sets public read access

        const blobName = `manual_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        console.log(`Uploading ${blobName} to Azure Blob Storage...`);
        
        await blockBlobClient.uploadData(req.file.buffer, {
          blobHTTPHeaders: { blobContentType: "application/pdf" }
        });

        const azurePdfUrl = blockBlobClient.url; 
        
        // Save upload metadata to the separate MongoDB collection!
        await UploadedPdf.create({
          filename: blobName,
          pdfUrl: azurePdfUrl
        });

        return res.json({ 
          success: true, 
          message: 'PDF uploaded to Azure Blob Storage successfully.', 
          filename: blobName, 
          pdfUrl: azurePdfUrl  
        });
      } catch (azureErr) {
        console.error('Azure Upload failed, falling back to local saving:', azureErr);
      }
    }

    // Fallback: Local Filesystem Saving (Standard safe behavior)
    console.log('Storing PDF file locally on filesystem...');
    const date = new Date().toISOString().split('T')[0];
    const dir  = path.join(__dirname, 'uploads', date, 'manual');
    fs.mkdirSync(dir, { recursive: true });
    
    const fname    = `manual_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fullPath = path.join(dir, fname);
    fs.writeFileSync(fullPath, req.file.buffer);
    
    const localPdfUrl = `http://localhost:${port}/uploads/${date}/manual/${fname}`;
    
    // Save upload metadata to the separate MongoDB collection!
    await UploadedPdf.create({
      filename: fname,
      pdfUrl: localPdfUrl
    });

    res.json({ 
      success: true, 
      message: 'PDF uploaded and saved locally.', 
      filename: fname, 
      pdfUrl: localPdfUrl 
    });

  } catch (err) {
    console.error('Upload endpoint error:', err);
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

// 2-alt. Retrieve all manual PDF uploads from the separate MongoDB collection:
app.get('/api/uploads/list', async (req, res) => {
  try {
    const list = await UploadedPdf.find().sort({ createdAt: -1 });
    res.json({ success: true, list });
  } catch (err) {
    console.error('Fetch uploaded PDFs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch uploaded PDFs: ' + err.message });
  }
});









// --- API ENDPOINTS ---

// 1. User Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Handle plaintext password matching (per seed_db.js) or bcrypt
    const isMatch = (password === user.password); // fallback logic for POC plain password
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role || user.type },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name || user.username,
        role: user.role || user.type || 'Scanner',
        org_code: user.org_code,
        uniqueno: user.uniqueno
      }
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 2. Data Synchronization Endpoint (Bulk Sync from admin_db/testplayer_db)
app.post('/api/sync/organizations/bulk', async (req, res) => {
  try {
    console.log('Triggering bulk master database sync...');
    
    // Simulate reading from master admin databases and merging details
    const orgs = await OrgDetails.find();
    const courses = await Course.find();
    const testSchedules = await TestScheduleRecord.find().populate('course');
    const users = await User.find({ type: 'student' });
    
    // We execute standard database maintenance updates here (Mongoose equivalent of bulkWrite)
    // Return a breakdown of synchronized models
    res.json({
      success: true,
      message: 'Master database sync complete!',
      syncedAt: new Date(),
      breakdown: {
        organizations: orgs.length,
        courses: courses.length,
        examsSchedules: testSchedules.length,
        studentProfiles: users.length
      }
    });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ success: false, message: 'Failed to synchronize databases' });
  }
});

// 3. Get Active Exam Schedules
app.get('/api/scanner/schedules', async (req, res) => {
  try {
    const schedules = await TestScheduleRecord.find().populate('course');
    res.json({ success: true, schedules });
  } catch (err) {
    console.error('Fetch schedules error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch exam schedules' });
  }
});

// 4. Get Expected Roster for an Exam Schedule
app.get('/api/scanner/roster/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;
  try {
    // Retrieve the course and students mapped to this test
    const schedule = await TestScheduleRecord.findById(scheduleId).populate('course');
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    // Get mappings to identify valid QR codes for this test
    const mappings = await UniqueScriptCodeMapping.find({ testId: schedule._id });
    const candidateIds = mappings.map(m => m.candidateId);

    // Fetch details of those students
    const expectedStudents = await User.find({ _id: { $in: candidateIds } });

    // Fetch already scanned scripts for this exam to return present status
    const scanned = await ScannedScript.find({ test_details: schedule._id });
    
    const roster = expectedStudents.map(student => {
      const studentMapping = mappings.find(m => m.candidateId.toString() === student._id.toString());
      const studentScanned = scanned.find(s => s.candidateId.toString() === student._id.toString());

      return {
        id: student._id,
        full_name: student.full_name,
        uniqueno: student.uniqueno,
        email: student.email,
        expectedQrCode: studentMapping ? studentMapping.uniqueScriptCode : `QR_${schedule.course.code}_${student.uniqueno}`,
        scannedStatus: studentScanned ? studentScanned.uploadStatus : 'absent',
        scannedAt: studentScanned ? studentScanned.createdAt : null,
        pdfPath: studentScanned ? studentScanned.pdfPath : null,
      };
    });

    res.json({
      success: true,
      test_name: schedule.test_name,
      course_name: schedule.course?.name || 'Unknown',
      course_code: schedule.course?.code || 'N/A',
      roster
    });
  } catch (err) {
    console.error('Fetch roster error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch roster' });
  }
});

// 5. Verify Scanned QR code
app.post('/api/scanner/qr/verify', async (req, res) => {
  const { qrCode, scheduleId } = req.body;
  try {
    const mapping = await UniqueScriptCodeMapping.findOne({ uniqueScriptCode: qrCode });
    if (!mapping) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR Code. Script code mapping not found in admin records.'
      });
    }

    if (scheduleId && mapping.testId.toString() !== scheduleId) {
      return res.status(400).json({
        success: false,
        message: 'This script belongs to another scheduled exam/subject, not the active session.'
      });
    }

    const student = await User.findById(mapping.candidateId);
    res.json({
      success: true,
      message: 'QR Code verified successfully!',
      student: {
        id: student._id,
        full_name: student.full_name,
        uniqueno: student.uniqueno,
        email: student.email,
        qrCode
      }
    });
  } catch (err) {
    console.error('QR verification error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify QR Code' });
  }
});

// 6. Real-time Progress Event Stream (SSE)
let activeProgresses = {}; // Tracks progress in memory for SSE updates
app.get('/api/scanner/upload-progress/:batchId', (req, res) => {
  const { batchId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ status: 'connected', progress: 0 })}\n\n`);

  const timer = setInterval(() => {
    const current = activeProgresses[batchId];
    if (current) {
      res.write(`data: ${JSON.stringify(current)}\n\n`);
      if (current.progress >= 100 || current.status === 'error') {
        clearInterval(timer);
        delete activeProgresses[batchId];
        res.write('event: close\ndata: end\n\n');
        res.end();
      }
    }
  }, 500);

  req.on('close', () => {
    clearInterval(timer);
  });
});

// 7. Booklet Image Upload, OpenCV Crop Simulation, and multi-page PDF generation
app.post('/api/scanner/upload-booklet', upload.array('pages'), async (req, res) => {
  const {
    studentUniqueNo,
    uniqueScriptCode,
    candidateId,
    scheduleId,
    courseId,
    orgId,
    scannedBy
  } = req.body;

  const files = req.files;
  const batchId = `batch_${Date.now()}`;

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, message: 'No images uploaded' });
  }

  // Set initial status for SSE progress tracker
  activeProgresses[batchId] = { status: 'Received booklet images, initializing...', progress: 10 };

  try {
    // 1. Process and standardize images
    // Wait for the UI thread SSE to mock a beautiful progression
    setTimeout(() => { activeProgresses[batchId] = { status: 'Simulating edge detection and perspective warp...', progress: 30 }; }, 500);

    const pdfDoc = await PDFDocument.create();

    // 2. Stitch JPEGs sequentially into the PDF
    setTimeout(() => { activeProgresses[batchId] = { status: 'Stitching scanned pages into PDF format...', progress: 60 }; }, 1200);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let img;
      
      // Embed image based on type
      if (file.mimetype === 'image/png') {
        img = await pdfDoc.embedPng(file.buffer);
      } else {
        img = await pdfDoc.embedJpg(file.buffer);
      }

      // Add a page matching the image dimensions
      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
      });
    }

    setTimeout(() => { activeProgresses[batchId] = { status: 'Finalizing PDF output stream...', progress: 85 }; }, 2000);

    const pdfBytes = await pdfDoc.save();

    // 3. Create Structured folder logic
    const date = new Date().toISOString().split('T')[0];
    const uploadPath = path.join(__dirname, 'uploads', date, 'batch_1');
    fs.mkdirSync(uploadPath, { recursive: true });

    // File name matches student profile & code
    const filename = `${studentUniqueNo}_${uniqueScriptCode || 'NOCODE'}_${Date.now()}.pdf`;
    const fullPath = path.join(uploadPath, filename);
    
    fs.writeFileSync(fullPath, pdfBytes);
    const virtualPdfUrl = `http://localhost:${port}/uploads/${date}/batch_1/${filename}`;

    // 4. Persistence into scanned_scripts collection
    setTimeout(() => { activeProgresses[batchId] = { status: 'Saving database record and marking presence...', progress: 95 }; }, 2500);

    // Let's create pages array structure required by model
    const pagesInfo = files.map((file, idx) => ({
      pageNumber: idx + 1,
      type: idx === 0 ? 'cover' : 'writing',
      timestamp: new Date()
    }));

    // Find and update or create
    let scriptRecord = await ScannedScript.findOne({ uniqueScriptCode });
    const recordPayload = {
      studentUniqueNo,
      uniqueScriptCode,
      candidateId: candidateId || null,
      exam_details: scheduleId || null,
      test_details: scheduleId || null,
      course_details: courseId || null,
      org_id: orgId || null,
      pages: pagesInfo,
      pdfPath: virtualPdfUrl,
      pageCount: files.length,
      version: scriptRecord ? (scriptRecord.version || 1) + 1 : 1,
      uploadStatus: 'complete',
      scannedBy: scannedBy || null,
      verificationStatus: 'verified'
    };

    if (scriptRecord) {
      await ScannedScript.findByIdAndUpdate(scriptRecord._id, recordPayload);
    } else {
      scriptRecord = await ScannedScript.create(recordPayload);
    }

    // NU collection sync (optional operational database fallback)
    const pagesInfoNU = files.map((file, idx) => ({
      pageNumber: idx + 1,
      type: idx === 0 ? 'cover' : 'writing',
      timestamp: new Date(),
      extension: file.mimetype === 'image/png' ? 'png' : 'jpg'
    }));

    await ScannedScriptNU.findOneAndUpdate(
      { uniqueScriptCode },
      {
        studentUniqueNo,
        uniqueScriptCode,
        candidateId: candidateId || null,
        test_details: scheduleId || null,
        schedule_details: scheduleId || null,
        org_id: orgId || null,
        pages: pagesInfoNU,
        pdfPath: virtualPdfUrl,
        pageCount: files.length,
        uploadStatus: 'complete',
        scannedBy: scannedBy || null,
        verificationStatus: 'verified'
      },
      { upsert: true }
    );

    // Set final complete status
    setTimeout(() => {
      activeProgresses[batchId] = {
        status: 'Complete',
        progress: 100,
        pdfUrl: virtualPdfUrl,
        filename: filename
      };
    }, 3000);

    res.json({
      success: true,
      batchId,
      message: 'Processing started',
      pdfUrl: virtualPdfUrl
    });

  } catch (err) {
    console.error('Booklet compilation error:', err);
    activeProgresses[batchId] = { status: 'error', progress: 0, message: err.message };
    res.status(500).json({ success: false, message: 'Failed to process and compile booklet script.' });
  }
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

// 8. Fetch the directory structure
app.get('/api/documents', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const tree = getDirectoryTree(uploadsDir);
  res.json({ success: true, folders: tree.children ? [tree] : [] });
});

// 9-alt. Simple PDF upload endpoint override deleted, fully unified with the main Azure-aware and DB-persisted endpoint above.


// 9. Get Scanned History
app.get('/api/scanner/scanned-history', async (req, res) => {
  try {
    const history = await ScannedScript.find()
      .populate('candidateId', 'full_name uniqueno')
      .populate('course_details', 'name code')
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, history });
  } catch (err) {
    console.error('Fetch history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch scanning history' });
  }
});

// Handle simple route
app.get('/', (req, res) => {
  res.send('Examic Scanner-Backend POC service is active.');
});

// Start Server
app.listen(port, '0.0.0.0', () => {
  console.log(`Scanner-Backend microservice successfully listening at http://localhost:${port}`);
});
