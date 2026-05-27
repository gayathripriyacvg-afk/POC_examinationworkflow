const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    testCode: { type: String },
    schedule_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'test_schedule_records' },
    currentQuestionIndex: { type: Number },
    remainingTime: { type: Number },
    breaksTaken: { type: Number },
    isSubmitted: { type: Boolean },
    isAnswerScriptGenerated: { type: Boolean },
    timeTaken: { type: Number },
    answers: [{ type: mongoose.Schema.Types.Mixed }],
    flagged: [{ type: mongoose.Schema.Types.Mixed }],
    fileUrls: [{ type: String }],
    test_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'questionpapers' }
}, { timestamps: true });

module.exports = mongoose.model('userprogresses', userProgressSchema);
