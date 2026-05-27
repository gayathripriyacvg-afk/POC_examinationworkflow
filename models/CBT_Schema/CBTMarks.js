const mongoose = require('mongoose');
const markSchema = new mongoose.Schema({
    question: { type: String },
    questionText: { type: mongoose.Schema.Types.Mixed },
    alloted_mark: { type: Number },
    type: { type: String, enum: ['objective', 'subjective', 'long'] },
    is_rubrics_evaluated: { type: Boolean },
    max_marks: { type: Number },
    correct_answer: { type: mongoose.Schema.Types.Mixed },
    user_answer: { type: mongoose.Schema.Types.Mixed },
    rubrics_evaluation: [{ type: mongoose.Schema.Types.Mixed }]
});
const cbtMarksSchema = new mongoose.Schema({
    scriptId: { type: mongoose.Schema.Types.ObjectId },
    candidateId: { type: mongoose.Schema.Types.ObjectId },
    testId: { type: mongoose.Schema.Types.ObjectId },
    testCode: { type: mongoose.Schema.Types.Mixed },
    schedule_Id: { type: mongoose.Schema.Types.ObjectId },
    test_type: { type: String },
    test_sub_type: { type: String },
    is_hiring_assessment: { type: Boolean },
    marks: [markSchema],
    totalMarks: { type: Number },
    totalMarksObtained: { type: Number },
    isObjectiveEvaluated: { type: Boolean },
    isSubjectiveEvaluated: { type: Boolean },
    isLongEvaluated: { type: Boolean },
    isReportGenerated: { type: Boolean },
    isRubricsEvaluated: { type: Boolean },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    examInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' }
}, { timestamps: true });
module.exports = mongoose.model('cbt_marks', cbtMarksSchema);