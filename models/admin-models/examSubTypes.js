const mongoose = require('mongoose');

const examSubTypesSchema = new mongoose.Schema({
    type: { type: String, required: true },
    exam_type: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_types', required: true }
}, { timestamps: true });

module.exports = mongoose.model('exam_sub_types', examSubTypesSchema);
