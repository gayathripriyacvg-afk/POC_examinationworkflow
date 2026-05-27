const mongoose = require('mongoose');

const answerScriptQrCodesNuSchema = new mongoose.Schema({
    qrcode: { type: String, unique: true, required: true },
    test_id: { type: mongoose.Schema.Types.ObjectId, ref: 'test_schedule_records' },
    schedule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'test_schedule_records' },
    candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
}, { timestamps: true });

module.exports = mongoose.model('answer_script_qrcodes_nu', answerScriptQrCodesNuSchema);
