const mongoose = require('mongoose');
const uniqueScriptCodeMappingSchema = new mongoose.Schema({
    uniqueScriptCode: { type: String, unique: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId },
    testId: { type: mongoose.Schema.Types.ObjectId },
    examId: { type: mongoose.Schema.Types.ObjectId },
    courseId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });
module.exports = mongoose.model('unique_script_code_mappings', uniqueScriptCodeMappingSchema);