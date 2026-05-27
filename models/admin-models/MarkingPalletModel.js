const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionNo: { type: String, required: true }, // e.g. "1a", "2b"
    label: { type: String },
    maxMarks: { type: Number, required: true },
    cobo: [{ type: String }] // Course Outcomes
});

const markingPalletSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'courses', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, required: true },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true },
    status: { type: String, enum: ['draft', 'frozen'], default: 'draft' },
    totalMarks: { type: Number },
    allowNegativeMarking: { type: Boolean, default: false },
    questions: [questionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    frozenAt: { type: Date },
    frozenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
}, { timestamps: true });

// Compound unique index on (examId, courseId, testId)
markingPalletSchema.index({ examId: 1, courseId: 1, testId: 1 }, { unique: true });

module.exports = mongoose.model('marking_pallets', markingPalletSchema);
