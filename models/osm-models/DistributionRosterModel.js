const mongoose = require('mongoose');
const distributionRosterSchema = new mongoose.Schema({
    evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    testId: { type: mongoose.Schema.Types.ObjectId },
    evaluationType: { type: String, enum: ['primary', 'review', 'moderation', 're_evaluation'] },
    previousRosterId: { type: mongoose.Schema.Types.ObjectId, ref: 'distribution_rosters' },
    assignedScripts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'scanned_scripts' }],
    scriptCount: { type: Number },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'reassigned'] },
    evaluationDueDate: { type: Date },
    evaluationRound: { type: Number },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    notes: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('distribution_rosters', distributionRosterSchema);