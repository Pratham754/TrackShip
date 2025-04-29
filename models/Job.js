const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    contactName: String,
    location: String,
    contactInfo: String,
    jobDescription: String,
    assignedTo: String,
    status: { type: String, enum: ['pending','out-for-delivery', 'complete'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
