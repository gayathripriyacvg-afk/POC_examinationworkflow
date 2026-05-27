const mongoose = require('mongoose');
const cbtScriptAnnotationsSchema = new mongoose.Schema({
    scriptId: { type: mongoose.Schema.Types.ObjectId },
    annotations: [{ type: mongoose.Schema.Types.Mixed }],
    lastUpdated: { type: Date }
}, { timestamps: true });
module.exports = mongoose.model('cbt_script_annotations', cbtScriptAnnotationsSchema);