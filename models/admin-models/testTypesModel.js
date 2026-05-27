const mongoose = require('mongoose');

const testTypesSchema = new mongoose.Schema({
    type: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('test_types', testTypesSchema);
