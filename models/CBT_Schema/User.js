const mongoose = require('mongoose');

const cbtUserSchema = new mongoose.Schema({
    full_name: { type: String },
    email: { type: String, unique: true },
    phone: { type: String },
    username: { type: String, unique: true },
    password: { type: String },
    dob: { type: Date },
    gender: { type: String },
    uniqueno: { type: String, unique: true },
    role: { type: String, enum: ['admin', 'candidate'] }
}, { timestamps: true });

module.exports = mongoose.models.cbt_users || mongoose.model('cbt_users', cbtUserSchema, 'users');
