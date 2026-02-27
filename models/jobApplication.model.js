const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'SkilledJob', required: true }, // link to job
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // link to applicant
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    phoneNo: { type: String, required: true, trim: true },

    applicationStatus: {
  type: String,
  enum: ['applied', 'interviewed', 'appointment_sent', 'hired', 'rejected'],
  default: 'applied'
},

    jobTitle: { type: String, trim: true },

    experience: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },


    // Portfolio Links
    portfolioLink: { type: String, trim: true },

    // Resume File
    resumeFile: { type: String, required: true },
    aiCvScore: { type: Number, default: 0 },
    jobMatchScore: { type: Number, default: 0 },
    feedback: { type: String, trim: true }
}, { timestamps: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
module.exports = JobApplication;
