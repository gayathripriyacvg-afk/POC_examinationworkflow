const mongoose = require('mongoose');

const schoolsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    address: { type: String },
    code: { type: String },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true }
}, { timestamps: true });

module.exports = mongoose.model('schools', schoolsSchema);
