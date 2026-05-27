const mongoose = require('mongoose');
const questionPaperSchema = new mongoose.Schema({
    test_name: { type: String },
    unit: { type: String },
    course_code: { type: String },
    course_name: { type: String },
    test_code: [{ type: String }],
    test_type: { type: String },
    test_sub_type: { type: String },
    org_code: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('questionpapers', questionPaperSchema);