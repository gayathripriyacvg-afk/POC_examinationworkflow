const mongoose = require('mongoose');

const orgRolesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    privileges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'privileges' }],
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true }
}, { timestamps: true });

module.exports = mongoose.model('org_roles', orgRolesSchema);
