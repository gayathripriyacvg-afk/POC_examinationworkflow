const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    full_name: { type: String },
    email: { type: String, unique: true, lowercase: true },
    phone: { type: String },
    username: { type: String, unique: true, lowercase: true },
    password: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String },
    org_code: { type: String },
    orgId: { type: mongoose.Schema.Types.ObjectId },
    uniqueno: { type: String, unique: true },
    role: [{ type: mongoose.Schema.Types.ObjectId }],
    type: { type: String, enum: ['admin', 'faculty', 'student'] },
    system: { type: String, enum: ['OSM', 'TP', 'Scheduler'] }
}, { timestamps: true });

module.exports = mongoose.model('users', userSchema);
