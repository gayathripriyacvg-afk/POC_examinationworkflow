const mongoose = require('mongoose');

const examTypesSchema = new mongoose.Schema({
    type: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('exam_types', examTypesSchema);
