const mongoose = require('mongoose');

const selectedTestSchema = new mongoose.Schema({
    test_name: { type: String },
    test_code: { type: String },
    duration: { type: Number }
});

const testScheduleRecordsSchema = new mongoose.Schema({
    schedule_id: { type: String, unique: true, required: true },
    exam_mode: { type: Number },
    test_schedule_info: {
        name: { type: String },
        description: { type: String }
    },
    users_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    selected_test: [selectedTestSchema],
    start_timestamp: { type: Date },
    end_timestamp: { type: Date },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    instruction: { type: String },
    proctors_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    is_proctoring_enabled: { type: Boolean, default: false },
    is_ai_proc: { type: Boolean, default: false },
    is_human_physical: { type: Boolean, default: false },
    is_human_proc: { type: Boolean, default: false },
    evaluators: { type: mongoose.Schema.Types.Mixed } // Mixed structure for complex proctor and grader allocations
}, { timestamps: true });

module.exports = mongoose.model('test_schedule_records', testScheduleRecordsSchema);
