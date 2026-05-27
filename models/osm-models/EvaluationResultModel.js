const mongoose = require('mongoose');
const evaluationResultSchema = new mongoose.Schema({
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    entryType: { type: String, enum: ['osm', 'data_entry'] },
    scriptId: { type: mongoose.Schema.Types.ObjectId, ref: 'scanned_scripts' },
    rosterId: { type: mongoose.Schema.Types.ObjectId, ref: 'distribution_rosters' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    testId: { type: mongoose.Schema.Types.ObjectId },
    evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    totalMarksAwarded: { type: Number },
    marksBreakdown: [{ questionNumber: String, marksAwarded: Number }],
    annotations: { type: String },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'] },
    overallComment: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('evaluation_results', evaluationResultSchema);