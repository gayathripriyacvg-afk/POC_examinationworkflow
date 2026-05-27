const mongoose = require('mongoose');

const courseScheduleDetailsSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    date: { type: Date },
    timings: { type: String }, // e.g. "10:00 AM - 01:00 PM"
    test_type: { type: mongoose.Schema.Types.ObjectId, ref: 'test_types' },
    venues: [{ type: String }] // venue names or IDs
});

const examTimeTableSchema = new mongoose.Schema({
    academic_details: { type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' },
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations' },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    course_schedule_details: [courseScheduleDetailsSchema]
}, { timestamps: true });

module.exports = mongoose.model('exam_time_tables', examTimeTableSchema);
