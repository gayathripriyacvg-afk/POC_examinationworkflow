const mongoose = require('mongoose');

const rosterCourseDetailsSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    venues: [{ type: String }]
});

const timeTableRosterSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations' },
    yearly_master_id: { type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' },
    time_table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_time_tables' },
    course_details: [rosterCourseDetailsSchema]
}, { timestamps: true });

module.exports = mongoose.model('time_table_rosters', timeTableRosterSchema);
