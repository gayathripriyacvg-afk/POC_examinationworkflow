const mongoose = require('mongoose');

const orgAdminSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: Number },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    isSuperAdmin: { type: Boolean, default: false },
    full_name: { type: String },
    phoneno: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dob: { type: Date },
    uniqueno: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('org_admins', orgAdminSchema);
