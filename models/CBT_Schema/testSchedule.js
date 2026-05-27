const mongoose = require('mongoose');

const testScheduleSchema = new mongoose.Schema({
    schedule_id: { type: String, unique: true },
    exam_mode: { type: Number },
    test_schedule_info: {
        name: { type: String },
        description: { type: String }
    },
    users_list: [{ type: String }], // Denormalized strings (usernames/uniquenos) rather than ObjectIds
    selected_test: [{
        test_name: { type: String },
        test_code: { type: String },
        duration: { type: Number },
        exam_info: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations' },
        course_details: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' }
    }],
    start_timestamp: { type: Date },
    end_timestamp: { type: Date },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    instruction: { type: String },
    proctors_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    is_proctoring_enabled: { type: Boolean },
    yearly_master_id: { type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    exam_info_id: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_informations' }
}, { timestamps: true });

module.exports = mongoose.models.cbt_test_schedules || mongoose.model('cbt_test_schedules', testScheduleSchema, 'test_schedule_records');
