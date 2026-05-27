const mongoose = require('mongoose');

const coursesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String },
    credits: { type: String },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true }
}, { timestamps: true });

module.exports = mongoose.model('courses', coursesSchema);
