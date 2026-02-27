// controllers/jobApplication.controller.js
const JobApplication = require('../models/jobApplication.model');
const SkilledJob = require('../models/skilledjob.model');
const path = require('path');
const { sendResponse } = require('../utils/responseHandler');
const extractText = require('../utils/extractText'); // utility to extract text from PDF/DOCX
const { getAiScores } = require('../utils/aiScoring'); // unified AI scoring
const User = require('../models/user.model');
const { title } = require('process');

// -----------------------------
// -----------------------------
// Create a new job application with CV and calculate AI scores
// -----------------------------
exports.applyToJob = async (req, res) => {
    try {
        const { jobId, ...applicationData } = req.body;

        // Check if job exists
        const job = await SkilledJob.findById(jobId);
        if (!job) {
            return sendResponse(res, {
                success: false,
                message: 'Job not found',
                statusCode: 404
            });
        }

        // Check if user already applied
        const alreadyApplied = await JobApplication.findOne({
            job: jobId,
            applicant: req.user.id
        });
        if (alreadyApplied) {
            return sendResponse(res, {
                success: false,
                message: 'You have already applied for this job',
                statusCode: 409
            });
        }

        // Check if resume is uploaded
        if (!req.file) {
            return sendResponse(res, {
                success: false,
                message: 'Resume file is required',
                statusCode: 400
            });
        }

        // Fetch applicant details from database
        const applicant = await User.findById(req.user.id);
        if (!applicant) {
            return sendResponse(res, {
                success: false,
                message: 'Applicant not found',
                statusCode: 404
            });
        }

        // Get fullName, email, and jobTitle from user record
        const fullName = `${applicant.firstName} ${applicant.lastName}`;
        const email = applicant.email;
        const jobTitle = applicant.jobTitle || ''; // fallback to empty string if not set

        // Extract text from uploaded resume
        const resumePath = path.join(__dirname, '../uploads', req.file.filename);
        const cvText = await extractText(resumePath);

        // Combine job description fields
        const jobDescription = [
            job.jobDescription,
            job.roleSummary,
            job.responsibilityOfEmployee,
            job.qualifications,
            job.experience
        ].join(' ');

        // Calculate AI scores using the unified getAiScores
        const { aiCvScore, jobMatchScore } = await getAiScores(cvText, jobDescription);

        // Create the job application
        const jobApplication = new JobApplication({
            ...applicationData,
            job: jobId,
            applicant: req.user.id,
            fullName,
            jobTitle, // <-- saved in DB
            experience: applicationData.experience, // <-- saved in DB
            email,
            applicationStatus: 'applied',
            resumeFile: req.file.filename,
            aiCvScore,
            jobMatchScore
        });

        await jobApplication.save();

        const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // Return response with fullName, email, and jobTitle
        sendResponse(res, {
            success: true,
            message: 'Job application submitted successfully',
            data: { ...jobApplication.toObject(), resumeFile: resumeUrl },
            statusCode: 201
        });

    } catch (error) {
        console.error('[ApplyToJob Error]', error);
        sendResponse(res, {
            success: false,
            message: error.message,
            statusCode: 400
        });
    }
};
// -----------------------------
// Get all applications for a specific job
// -----------------------------
exports.getApplicationsByJobId = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await SkilledJob.findById(jobId);
        if (!job) {
            return sendResponse(res, {
                success: false,
                message: 'Job not found',
                statusCode: 404
            });
        }

        const applications = await JobApplication.find({ job: jobId });

        const appsWithScores = applications.map(app => ({
            _id: app._id,
            userId: app.applicant,
            resumeFile: `${req.protocol}://${req.get('host')}/uploads/${app.resumeFile}`,
            aiCvScore: app.aiCvScore,
            description: app.description,
            city: app.city,
            jobTitle: app.jobTitle,
            experience: app.experience,
            jobMatchScore: app.jobMatchScore,
            applicationStatus: app.applicationStatus,
            fullName: app.fullName,
            email: app.email
        }));

        sendResponse(res, {
            success: true,
            message: 'Applications fetched successfully with AI scores',
            data: appsWithScores,
            statusCode: 200
        });

    } catch (error) {
        console.error('[GetApplicationsByJobId Error]', error);
        sendResponse(res, {
            success: false,
            message: error.message,
            statusCode: 500
        });
    }
};

// -----------------------------
// Get all jobs applied by the logged-in user
// -----------------------------
exports.getMyApplications = async (req, res) => {
    try {
        const applications = await JobApplication.find({ applicant: req.user.id })
            .populate('job');

        const formattedApplications = applications.map(app => ({
            ...app.job.toObject(),
            applicationStatus: app.applicationStatus,
            resumeFile: `${req.protocol}://${req.get('host')}/uploads/${app.resumeFile}`,
            aiCvScore: app.aiCvScore,
            jobMatchScore: app.jobMatchScore
        }));

        sendResponse(res, {
            success: true,
            message: 'Applied jobs fetched successfully',
            data: formattedApplications,
            statusCode: 200
        });
    } catch (error) {
        console.error('[GetMyApplications Error]', error);
        sendResponse(res, {
            success: false,
            message: 'Server error',
            errors: error.message,
            statusCode: 500
        });
    }
};

// -----------------------------
// Update application status
// -----------------------------
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            'applied',
            'interviewed',
            'appointment_sent',
            'hired',
            'rejected'
        ];

        if (!allowedStatuses.includes(status)) {
            return sendResponse(res, {
                success: false,
                message: 'Invalid status',
                statusCode: 400
            });
        }

        const application = await JobApplication.findById(applicationId);
        if (!application) {
            return sendResponse(res, {
                success: false,
                message: 'Application not found',
                statusCode: 404
            });
        }

        application.applicationStatus = status;
        await application.save();

        return sendResponse(res, {
            success: true,
            message: `Application moved to ${status}`,
            data: application,
            statusCode: 200
        });

    } catch (error) {
        console.error('[UpdateApplicationStatus Error]', error);
        return sendResponse(res, {
            success: false,
            message: 'Server error',
            errors: error.message,
            statusCode: 500
        });
    }
};
