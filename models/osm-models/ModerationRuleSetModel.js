const mongoose = require('mongoose');
const ruleSchema = new mongoose.Schema({
    type: { type: String, enum: ['MARK_PERCENTAGE', 'DEVIATION_FROM_AVERAGE', 'RANDOM_SAMPLING'] },
    condition: { type: String, enum: ['GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'PERCENTAGE_OF_TOTAL'] },
    values: [{ type: Number }],
    name: { type: String }
});
const moderationRuleSetSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    rules: [ruleSchema],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('moderation_rule_sets', moderationRuleSetSchema);