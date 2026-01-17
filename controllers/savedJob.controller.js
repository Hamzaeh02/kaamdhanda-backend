const SavedJob = require('../models/save.model');
const Job = require('../models/skilledjob.model');
const { sendResponse } = require('../utils/responseHandler');

/* SAVE / UNSAVE JOB */
const savedJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;

    const existing = await SavedJob.findOne({ user: userId, job: jobId });

    if (existing) {
      await SavedJob.deleteOne({ _id: existing._id });
      await Job.findByIdAndUpdate(jobId, { isSaved: false });

      return sendResponse(res, {
        success: true,
        message: 'Job removed from saved jobs',
        data: { saved: false },
        statusCode: 200
      });
    }

    await SavedJob.create({ user: userId, job: jobId });
    await Job.findByIdAndUpdate(jobId, { isSaved: true });

    return sendResponse(res, {
      success: true,
      message: 'Job saved successfully',
      data: { saved: true },
      statusCode: 201
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

/* GET ALL SAVED JOBS */
const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    const savedJobs = await SavedJob.find({ user: userId })
      .populate('job')
      .sort({ createdAt: -1 });

    return sendResponse(res, {
      success: true,
      message: 'Saved jobs fetched successfully',
      data: savedJobs,
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

module.exports = {
  savedJob,
  getSavedJobs
};
