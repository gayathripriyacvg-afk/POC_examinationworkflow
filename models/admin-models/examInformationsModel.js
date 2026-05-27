const mongoose = require('mongoose');

const testDetailsSchema = new mongoose.Schema({
    test_type: { type: mongoose.Schema.Types.ObjectId, ref: 'test_types' },
    course_details: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    marks: { type: Number },
    mode: { type: String, enum: ['Paper Based + Data Entry', 'Paper Based + OSM', 'Online'] },
    duration: { type: Number }, // in minutes
    weightage: { type: Number },
    blueprint_details: { type: String } // SAS URLs / links
});

const examInformationsSchema = new mongoose.Schema({
    exam_name: { type: String, required: true },
    exam_type: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_types' },
    exam_sub_type: { type: mongoose.Schema.Types.ObjectId, ref: 'exam_sub_types' },
    yearly_master_details: { type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    moderationRuleSetId: { type: mongoose.Schema.Types.ObjectId, ref: 'moderation_rule_sets' },
    is_multi_campuses: { type: Boolean, default: false },
    is_osm_enabled: { type: Boolean, default: false },
    multi_yearly_masters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' }],
    test_details: [testDetailsSchema]
}, { timestamps: true });

module.exports = mongoose.model('exam_informations', examInformationsSchema);
