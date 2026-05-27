const mongoose = require('mongoose');

const yearlyMasterSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'schools' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'programs' },
    batch: { type: String },
    batch_name: { type: String },
    academic_year: { type: String },
    term: { type: String },
    course_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'courses' }],
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' }
}, { timestamps: true });

module.exports = mongoose.model('yearly_masters', yearlyMasterSchema);
