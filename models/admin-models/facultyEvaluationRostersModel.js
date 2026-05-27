const mongoose = require('mongoose');

const facultyEvaluationRostersSchema = new mongoose.Schema({
    academic_details: { type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' },
    exam_details: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations' },
    user_details: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    course_details: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    duration: {
        start: { type: Date },
        end: { type: Date }
    }
}, { timestamps: true });

module.exports = mongoose.model('faculty_evaluation_rosters', facultyEvaluationRostersSchema);
