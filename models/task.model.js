const mongoose = require('mongoose');
const taskJobSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true, trim: true },
    jobDescription: { type: String, required: true, trim: true },
    budget: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    selectCategory: { type: String, required: true, trim: true },
    galleryImages: { type: [String], default: [] },
    address: { type: String, required: true, trim: true },
    lattitude: { type: String, required: true, trim: true },
    longitude: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const TaskJob = mongoose.model('TaskJob', taskJobSchema);
module.exports = TaskJob;