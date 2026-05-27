const mongoose = require('mongoose');
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
module.exports = mongoose.model('answerscripts', answerScriptSchema);