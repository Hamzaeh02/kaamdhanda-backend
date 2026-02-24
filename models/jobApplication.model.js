const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'SkilledJob', required: true }, // link to job
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // link to applicant
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    phoneNo: { type: String, required: true, trim: true },

    applicationStatus: { type: String, enum: ['applied', 'under review', 'interview scheduled', 'rejected', 'hired'], default: 'applied' },

    // Experience Details
    jobTitle: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String, required: true, trim: true },

    // Education Details
    highestEducation: { type: String, required: true, trim: true },
    institutionName: { type: String, required: true, trim: true },
    graduationYear: { type: Number, required: true },
    cgpa: { type: String, trim: true },

    // Portfolio Links
    portfolioLink: { type: String, trim: true },

    // Resume File
    resumeFile: { type: String, required: true },
    aiCvScore: { type: Number, default: 0 },
    jobMatchScore: { type: Number, default: 0 },
}, { timestamps: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
module.exports = JobApplication;
