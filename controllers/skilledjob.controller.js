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
      employer: req.user.id,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // default: Open jobs
    const status = req.query.status || 'Open';

    const filter = { statusOfJob: status };

    const totalJobs = await Job.countDocuments(filter);

    const jobs = await Job.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return sendResponse(res, {
      success: true,
      message: `${status} jobs fetched successfully`,
      data: {
        jobs,
        pagination: {
          totalJobs,
          currentPage: page,
          totalPages: Math.ceil(totalJobs / limit),
          limit,
        }
      },
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


exports.getAllRecommendedJobs = async (req, res) => {
  try {
    const { title } = req.query;

    if (!title) {
      return sendResponse(res, {
        success: false,
        message: 'Title is required',
        statusCode: 400
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      jobTitle: { $regex: title, $options: 'i' },
      statusOfJob: 'Open' // ✅ only open jobs
    };

    const recommendedJobs = await Job.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalRecommended = await Job.countDocuments(filter);

    return sendResponse(res, {
      success: true,
      message: 'Recommended open jobs fetched successfully',
      data: {
        jobs: recommendedJobs,
        pagination: {
          totalJobs: totalRecommended,
          currentPage: page,
          totalPages: Math.ceil(totalRecommended / limit),
          limit,
        }
      },
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


exports.getClosedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ statusOfJob: 'Closed' })
      .sort({ createdAt: -1 });

    return sendResponse(res, {
      success: true,
      message: 'Closed jobs fetched successfully',
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


// Get jobs created by logged-in employer
exports.getMyEmployerJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalJobs = await Job.countDocuments({ employer: req.user.id });

    const jobs = await Job.find({ employer: req.user.id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return sendResponse(res, {
      success: true,
      message: 'My employer jobs fetched successfully',
      data: {
        jobs,
        pagination: {
          totalJobs,
          currentPage: page,
          totalPages: Math.ceil(totalJobs / limit),
          limit,
        }
      },
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

// Toggle job status (Open <-> Closed)
exports.toggleJobStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);

    if (!job) {
      return sendResponse(res, {
        success: false,
        message: 'Job not found',
        statusCode: 404,
      });
    }

    // 🔒 optional: sirf job ka owner toggle kar sakta hai
    if (job.employer.toString() !== req.user.id) {
      return sendResponse(res, {
        success: false,
        message: 'Not authorized to change job status',
        statusCode: 403,
      });
    }

    // 🔁 toggle logic
    job.statusOfJob = job.statusOfJob === 'Open' ? 'Closed' : 'Open';

    await job.save();

    return sendResponse(res, {
      success: true,
      message: `Job status changed to ${job.statusOfJob}`,
      data: job,
      statusCode: 200,
    });

  } catch (error) {
    return sendResponse(res, {
      success: false,
      message: 'Server error',
      errors: error.message,
      statusCode: 500,
    });
  }
};


// // Toggle job's isSaved status
// exports.toggleJobSaved = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const job = await Job.findById(id);

//     if (!job) {
//       return sendResponse(res, {
//         success: false,
//         message: 'Job not found',
//         statusCode: 404,
//       });
//     }

//     // 🔁 toggle logic
//     job.isSaved = !job.isSaved;

//     await job.save();

//     return sendResponse(res, {
//       success: true,
//       message: `Job saved status changed to ${job.isSaved}`,
//       data: { jobId: job._id, isSaved: job.isSaved },
//       statusCode: 200,
//     });

//   } catch (error) {
//     return sendResponse(res, {
//       success: false,
//       message: 'Server error',
//       errors: error.message,
//       statusCode: 500,
//     });
//   }
// };
