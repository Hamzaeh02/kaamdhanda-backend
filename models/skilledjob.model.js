const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true, trim: true },
    jobDescription: { type: String, required: true, trim: true },
    jobType: { type: String, required: true, trim: true },
    jobMode: { type: String, required: true, trim: true },
    experienceLevel: { type: String, required: true, trim: true },
    pay: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    companyLocation: { type: String, required: true, trim: true },
    statusOfJob: { type: String, required: true, trim: true },
    isSaved: { type: Boolean, default: false },
    workingHours: { type: String, required: true, trim: true },
    qualifications: { type: String, required: true },
    experience: { type: String, required: true, trim: true },
    lastDateToApply: { type: String, required: true },
    contactNumber: { type: Number, required: true, trim: true },
    roleSummary: { type: String, required: true, trim: true },
    responsibilityOfEmployee: { type: String, required: true, trim: true },
    AboutCompany: { type: String, required: true, trim: true },

    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true },
}, { timestamps: true });

const SkilledJob = mongoose.model('SkilledJob', jobSchema);
module.exports = SkilledJob;

