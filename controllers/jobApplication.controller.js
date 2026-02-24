const JobApplication = require('../models/jobApplication.model');
const SkilledJob = require('../models/skilledjob.model');
const path = require('path');
const { sendResponse } = require('../utils/responseHandler');
const extractText = require('../utils/extractText');
const { getAiScores } = require('../utils/aiScoring');

// -----------------------------
// Apply to Job (AI Scoring)
// -----------------------------
exports.applyToJob = async (req, res) => {
  try {
    const { jobId, ...applicationData } = req.body;

    // 1️⃣ Validate job
    const job = await SkilledJob.findById(jobId);
    if (!job) {
      return sendResponse(res, {
        success: false,
        message: 'Job not found',
        statusCode: 404
      });
    }

    // 2️⃣ Prevent duplicate applications
    const alreadyApplied = await JobApplication.findOne({
      job: jobId,
      applicant: req.user.id
    });

    if (alreadyApplied) {
      return sendResponse(res, {
        success: false,
        message: 'Already applied to this job',
        statusCode: 409
      });
    }

    // 3️⃣ Resume validation
    if (!req.file) {
      return sendResponse(res, {
        success: false,
        message: 'Resume is required',
        statusCode: 400
      });
    }

    // 4️⃣ Extract CV text
    const resumePath = path.join(__dirname, '../uploads', req.file.filename);
    let cvText = await extractText(resumePath);

    // Trim CV text to avoid AI quota abuse
    cvText = cvText.slice(0, 3000);

    // 5️⃣ Prepare job description
    let jobDescription = [
      job.jobDescription,
      job.roleSummary,
      job.responsibilityOfEmployee,
      job.qualifications,
      job.experience
    ].filter(Boolean).join(' ');

    jobDescription = jobDescription.slice(0, 2000);

    // 6️⃣ AI scoring
    const {
      aiCvScore,
      jobMatchScore,
      feedback
    } = await getAiScores(cvText, jobDescription);

    // 7️⃣ Save application
    const jobApplication = new JobApplication({
      ...applicationData,
      job: jobId,
      applicant: req.user.id,
      fullName: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      applicationStatus: 'applied',
      resumeFile: req.file.filename,
      aiCvScore,
      jobMatchScore,
      aiFeedback: feedback
    });

    await jobApplication.save();

    const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    return sendResponse(res, {
      success: true,
      message: 'Applied successfully',
      data: {
        ...jobApplication.toObject(),
        resumeFile: resumeUrl
      },
      statusCode: 201
    });

  } catch (error) {
    console.error('[ApplyToJob Error]', error);
    return sendResponse(res, {
      success: false,
      message: error.message || 'Application failed',
      statusCode: 400
    });
  }
};

// -----------------------------
// Get Applications by Job ID
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
      jobMatchScore: app.jobMatchScore,
      aiFeedback: app.aiFeedback,
      applicationStatus: app.applicationStatus,
      fullName: app.fullName,
      email: app.email
    }));

    return sendResponse(res, {
      success: true,
      message: 'Applications fetched successfully',
      data: appsWithScores,
      statusCode: 200
    });

  } catch (error) {
    console.error('[GetApplicationsByJobId Error]', error);
    return sendResponse(res, {
      success: false,
      message: error.message,
      statusCode: 500
    });
  }
};

// -----------------------------
// Get Applications of Logged-in User
// -----------------------------
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await JobApplication
      .find({ applicant: req.user.id })
      .populate('job');

    const formattedApplications = applications.map(app => ({
      ...app.job.toObject(),
      applicationStatus: app.applicationStatus,
      resumeFile: `${req.protocol}://${req.get('host')}/uploads/${app.resumeFile}`,
      aiCvScore: app.aiCvScore,
      jobMatchScore: app.jobMatchScore,
      aiFeedback: app.aiFeedback
    }));

    return sendResponse(res, {
      success: true,
      message: 'Applied jobs fetched successfully',
      data: formattedApplications,
      statusCode: 200
    });

  } catch (error) {
    console.error('[GetMyApplications Error]', error);
    return sendResponse(res, {
      success: false,
      message: 'Server error',
      errors: error.message,
      statusCode: 500
    });
  }
};
