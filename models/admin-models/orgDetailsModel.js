const mongoose = require('mongoose');

const orgDetailsSchema = new mongoose.Schema({
    org_code: { type: String, unique: true, required: true },
    org_name: { type: String, unique: true, required: true },
    org_type: { type: String },
    org_address: { type: String },
    privileges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'privileges' }],
    org_parent: { type: mongoose.Schema.Types.ObjectId },
    qbms_id: { type: Number },
    org_location: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('org_details', orgDetailsSchema);
