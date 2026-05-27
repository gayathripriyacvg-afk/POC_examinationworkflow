const mongoose = require('mongoose');
const scannedScriptNUSchema = new mongoose.Schema({
    studentUniqueNo: { type: String },
    uniqueScriptCode: { type: String, unique: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId },
    test_details: { type: mongoose.Schema.Types.ObjectId, ref: 'test_schedule_records' },
    schedule_details: { type: mongoose.Schema.Types.ObjectId, ref: 'test_schedule_records' },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    pages: [{ pageNumber: Number, type: { type: String }, timestamp: Date, extension: String }],
    pdfPath: { type: String },
    pageCount: { type: Number },
    uploadStatus: { type: String, enum: ['initialized', 'processing', 'complete', 'error'] },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    verificationStatus: { type: String, enum: ['unverified', 'verified', 'flagged'] }
}, { timestamps: true });
module.exports = mongoose.model('scanned_scripts_nu', scannedScriptNUSchema);