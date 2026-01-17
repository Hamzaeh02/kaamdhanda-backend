const Job = require('../models/skilledjob.model');
const { sendResponse } = require('../utils/responseHandler');

// Create a new job posting
exports.createJob = async (req, res) => {
  try {
    const {
      jobTitle,
      jobDescription,
      jobType,
      jobMode,
      experienceLevel,
      pay,
      companyName,
      companyLocation,
      statusOfJob,
      workingHours,
      qualifications,
      experience,
      lastDateToApply,
      contactNumber,
      roleSummary,
      responsibilityOfEmployee,
      AboutCompany,
    } = req.body;

    const requiredFields = [
      'jobTitle', 'jobDescription', 'jobType', 'jobMode', 'experienceLevel',
      'pay', 'companyName', 'companyLocation', 'statusOfJob', 'workingHours',
      'qualifications', 'experience', 'lastDateToApply', 'contactNumber',
      'roleSummary', 'responsibilityOfEmployee', 'AboutCompany'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return sendResponse(res, {
          success: false,
          message: `${field} is required`,
          statusCode: 400
        });
      }
    }

    const job = new Job({
      jobTitle,
      jobDescription,
      jobType,
      jobMode,
      experienceLevel,
      pay,
      companyName,
      companyLocation,
      statusOfJob,
      isSaved: false,
      workingHours,
      qualifications,
      experience,
      lastDateToApply,
      contactNumber,
      roleSummary,
      responsibilityOfEmployee,
      AboutCompany,
      user: req.user.id,
    });

    await job.save();

    return sendResponse(res, {
      success: true,
      message: 'Job created successfully',
      data: job,
      statusCode: 201
    });

  } catch (error) {
    console.error('Create Job Error:', error);
    return sendResponse(res, {
      success: false,
      message: 'Server error',
      errors: error.message,
      statusCode: 500
    });
  }
};

// Get all job postings
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find();

    return sendResponse(res, {
      success: true,
      message: 'Jobs fetched successfully',
      data: jobs,
      statusCode: 200
    });
  } catch (error) {
    return sendResponse(res, {
      success: false,
      message: 'Server error',
      errors: error.message,
      statusCode: 500
    });
  }
};

// Get a single job posting by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return sendResponse(res, {
        success: false,
        message: 'Job not found',
        statusCode: 404
      });
    }

    return sendResponse(res, {
      success: true,
      message: 'Job fetched successfully',
      data: job,
      statusCode: 200
    });
  } catch (error) {
    return sendResponse(res, {
      success: false,
      message: 'Server error',
      errors: error.message,
      statusCode: 500
    });
  }
};

// Get jobs created by logged-in user
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user.id });

    return sendResponse(res, {
      success: true,
      message: 'My jobs fetched successfully',
      data: jobs,
      statusCode: 200
    });
  } catch (error) {
    return sendResponse(res, {
      success: false,
      message: 'Server error',
      errors: error.message,
      statusCode: 500
    });
  }
};

// Update a job posting by ID
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!job) {
      return sendResponse(res, {
        success: false,
        message: 'Job not found',
        statusCode: 404
      });
    }

    return sendResponse(res, {
      success: true,
      message: 'Job updated successfully',
      data: job,
      statusCode: 200
    });
  } catch (error) {
    return sendResponse(res, {
      success: false,
      message: 'Server error',
      errors: error.message,
      statusCode: 500
    });
  }
};

// Delete a job posting by ID
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return sendResponse(res, {
        success: false,
        message: 'Job not found',
        statusCode: 404
      });
    }

    return sendResponse(res, {
      success: true,
      message: 'Job deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return sendResponse(res, {
      success: false,
      message: 'Server error',
      errors: error.message,
      statusCode: 500
    });
  }
};
