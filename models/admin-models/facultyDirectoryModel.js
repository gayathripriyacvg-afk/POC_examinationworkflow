const mongoose = require('mongoose');

const facultyDirectorySchema = new mongoose.Schema({
    academic_details: { type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' },
    course_details: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    user_details: { type: mongoose.Schema.Types.ObjectId },
    role_details: [{ type: mongoose.Schema.Types.ObjectId, ref: 'org_roles' }]
}, { timestamps: true });

module.exports = mongoose.model('faculty_directories', facultyDirectorySchema);
