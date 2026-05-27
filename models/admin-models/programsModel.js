const mongoose = require('mongoose');

const programsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String },
    duration: { type: Number },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true },
    credits: { type: String },
    scheme: { type: String, enum: ['Annual', 'Trimester', 'Semester'] }
}, { timestamps: true });

module.exports = mongoose.model('programs', programsSchema);
