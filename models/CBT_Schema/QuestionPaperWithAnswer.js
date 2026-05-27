const mongoose = require('mongoose');

const questionPaperWithAnswerSchema = new mongoose.Schema({
    test_name: { type: String },
    unit: { type: String },
    course_code: { type: String },
    course_name: { type: String },
    test_code: [{ type: String }],
    test_type: { type: String },
    test_sub_type: { type: String },
    org_code: { type: String },
    isAdaptive: { type: Boolean },
    isRubricsPresent: { type: Boolean },
    encryptedData: { type: String },
    encryptedAesKey: { type: String },
    iv: { type: String },
    signature: { type: String },
    merkleRoot: { type: String },
    isShuffle: { type: Boolean },
    isManualEval: { type: Boolean },
    isMLEval: { type: Boolean },
    containsSubjective: { type: Boolean },
    duration: { type: Number },
    auto_evaluate: { type: Boolean },
    answerKey: { type: mongoose.Schema.Types.Mixed },
    questions: [{ type: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });

module.exports = mongoose.model('questionpaperanswerscripts', questionPaperWithAnswerSchema);
