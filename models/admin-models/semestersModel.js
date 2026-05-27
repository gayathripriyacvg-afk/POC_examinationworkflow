const mongoose = require('mongoose');

const semestersSchema = new mongoose.Schema({
    no_of_semsisters: { type: String },
    location: { type: String },
    address: { type: String },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true }
}, { timestamps: true });

module.exports = mongoose.model('semesters', semestersSchema);
