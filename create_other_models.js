const fs = require('fs');
const path = require('path');

const osmModelsDir = path.join(__dirname, 'models', 'osm-models');
const scannerModelsDir = path.join(__dirname, 'models', 'scanner-models');
const cbtModelsDir = path.join(__dirname, 'models', 'CBT_Schema');

[osmModelsDir, scannerModelsDir, cbtModelsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const filesToCreate = {
    // OSM Models
    [path.join(osmModelsDir, 'DistributionRosterModel.js')]: `const mongoose = require('mongoose');
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
module.exports = mongoose.model('distribution_rosters', distributionRosterSchema);`,

    [path.join(osmModelsDir, 'EvaluationResultModel.js')]: `const mongoose = require('mongoose');
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
module.exports = mongoose.model('evaluation_results', evaluationResultSchema);`,

    [path.join(osmModelsDir, 'ModerationRuleSetModel.js')]: `const mongoose = require('mongoose');
const ruleSchema = new mongoose.Schema({
    type: { type: String, enum: ['MARK_PERCENTAGE', 'DEVIATION_FROM_AVERAGE', 'RANDOM_SAMPLING'] },
    condition: { type: String, enum: ['GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'PERCENTAGE_OF_TOTAL'] },
    values: [{ type: Number }],
    name: { type: String }
});
const moderationRuleSetSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    rules: [ruleSchema],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('moderation_rule_sets', moderationRuleSetSchema);`,

    // Scanner Models
    [path.join(scannerModelsDir, 'ScriptModel.js')]: `const mongoose = require('mongoose');
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
module.exports = mongoose.model('scanned_scripts', scriptSchema);`,

    [path.join(scannerModelsDir, 'ScannedScriptNUModel.js')]: `const mongoose = require('mongoose');
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
module.exports = mongoose.model('scanned_scripts_nu', scannedScriptNUSchema);`,

    [path.join(scannerModelsDir, 'UniqueScriptCodeMappingModel.js')]: `const mongoose = require('mongoose');
const uniqueScriptCodeMappingSchema = new mongoose.Schema({
    uniqueScriptCode: { type: String, unique: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId },
    testId: { type: mongoose.Schema.Types.ObjectId },
    examId: { type: mongoose.Schema.Types.ObjectId },
    courseId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });
module.exports = mongoose.model('unique_script_code_mappings', uniqueScriptCodeMappingSchema);`,

    // CBT Models
    [path.join(cbtModelsDir, 'CBTMarks.js')]: `const mongoose = require('mongoose');
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
module.exports = mongoose.model('cbt_marks', cbtMarksSchema);`,

    [path.join(cbtModelsDir, 'CBTScriptAnnotations.js')]: `const mongoose = require('mongoose');
const cbtScriptAnnotationsSchema = new mongoose.Schema({
    scriptId: { type: mongoose.Schema.Types.ObjectId },
    annotations: [{ type: mongoose.Schema.Types.Mixed }],
    lastUpdated: { type: Date }
}, { timestamps: true });
module.exports = mongoose.model('cbt_script_annotations', cbtScriptAnnotationsSchema);`,

    [path.join(cbtModelsDir, 'CBT_Marks_NU.js')]: `const mongoose = require('mongoose');
const cbtMarksNUSchema = new mongoose.Schema({
    scriptId: { type: mongoose.Schema.Types.ObjectId, unique: true },
    rosterId: { type: mongoose.Schema.Types.ObjectId },
    evaluatorId: { type: mongoose.Schema.Types.ObjectId },
    marksBreakdown: [{ questionNumber: String, marksAwarded: Number }],
    overallComment: { type: String },
    annotations: { type: String },
    status: { type: String, enum: ['in_progress', 'completed'] }
}, { timestamps: true });
module.exports = mongoose.model('cbt_marks_nu', cbtMarksNUSchema);`,

    [path.join(cbtModelsDir, 'AnswerScript.js')]: `const mongoose = require('mongoose');
const answerScriptSchema = new mongoose.Schema({
    testCode: { type: String },
    schedule_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'test_schedule_records' },
    uniqueno: { type: String },
    encryptedData: { type: String },
    encryptedAesKey: { type: String },
    timeTaken: { type: Number },
    iv: { type: String },
    signature: { type: String },
    merkleRoot: { type: String },
    isSubjectiveAnswered: { type: Boolean },
    isLongAnswered: { type: Boolean },
    isObjectiveAnswered: { type: Boolean },
    isObjectiveEvaluated: { type: Boolean },
    isSubjectiveEvaluated: { type: Boolean },
    isLongEvaluated: { type: Boolean },
    canViewReport: { type: Boolean },
    testAttempt: { type: Number },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    test_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPaper' }
}, { timestamps: true });
module.exports = mongoose.model('answerscripts', answerScriptSchema);`,

    [path.join(cbtModelsDir, 'QuestionPaper.js')]: `const mongoose = require('mongoose');
const questionPaperSchema = new mongoose.Schema({
    test_name: { type: String },
    unit: { type: String },
    course_code: { type: String },
    course_name: { type: String },
    test_code: [{ type: String }],
    test_type: { type: String },
    test_sub_type: { type: String },
    org_code: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('questionpapers', questionPaperSchema);`
};

for (const [filePath, content] of Object.entries(filesToCreate)) {
    fs.writeFileSync(filePath, content);
    console.log('Created ' + filePath);
}
