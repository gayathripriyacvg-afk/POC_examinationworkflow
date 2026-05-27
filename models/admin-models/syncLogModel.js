const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
    triggeredBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
        userName: { type: String }
    },
    status: { type: String, enum: ['COMPLETED', 'PARTIAL_SUCCESS', 'FAILED'], required: true },
    summary: {
        totalRequested: { type: Number },
        totalFound: { type: Number },
        successful: { type: Number },
        failed: { type: Number }
    },
    performance: {
        totalTimeMs: { type: Number },
        avgTimePerOrgMs: { type: Number },
        maxConcurrency: { type: Number }
    },
    results: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

module.exports = mongoose.model('sync_logs', syncLogSchema);
