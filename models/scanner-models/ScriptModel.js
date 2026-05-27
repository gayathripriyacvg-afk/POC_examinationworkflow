const mongoose = require('mongoose');
const scriptSchema = new mongoose.Schema({
    studentUniqueNo: { type: String },
    uniqueScriptCode: { type: String, unique: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    exam_details: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations' },
    test_details: { type: mongoose.Schema.Types.ObjectId },
    course_details: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    pages: [{ pageNumber: Number, type: { type: String }, timestamp: Date }],
    pdfPath: { type: String },
    pageCount: { type: Number },
    version: { type: Number },
    uploadStatus: { type: String, enum: ['initialized', 'processing', 'complete', 'error'] },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    verificationStatus: { type: String, enum: ['unverified', 'verified', 'flagged'] }
}, { timestamps: true });
module.exports = mongoose.model('scanned_scripts', scriptSchema);