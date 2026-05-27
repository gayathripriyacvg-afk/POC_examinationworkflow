const mongoose = require('mongoose');

const privilegesSchema = new mongoose.Schema({
    p_name: { type: String, required: true },
    p_key_name: { type: String, required: true },
    p_id: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('privileges', privilegesSchema);
