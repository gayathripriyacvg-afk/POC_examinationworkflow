const mongoose = require('mongoose');
const cbtMarksNUSchema = new mongoose.Schema({
    scriptId: { type: mongoose.Schema.Types.ObjectId, unique: true },
    rosterId: { type: mongoose.Schema.Types.ObjectId },
    evaluatorId: { type: mongoose.Schema.Types.ObjectId },
    marksBreakdown: [{ questionNumber: String, marksAwarded: Number }],
    overallComment: { type: String },
    annotations: { type: String },
    status: { type: String, enum: ['in_progress', 'completed'] }
}, { timestamps: true });
module.exports = mongoose.model('cbt_marks_nu', cbtMarksNUSchema);