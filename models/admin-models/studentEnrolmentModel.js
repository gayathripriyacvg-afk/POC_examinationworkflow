const mongoose = require('mongoose');

const studentEnrolmentSchema = new mongoose.Schema({
    academic_details: { type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    student_ids: [{ type: mongoose.Schema.Types.ObjectId }]
}, { timestamps: true });

module.exports = mongoose.model('student_enrolments', studentEnrolmentSchema);
