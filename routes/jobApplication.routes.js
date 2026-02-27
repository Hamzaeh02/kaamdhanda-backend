const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const upload = require('../middleware/upload'); // your current multer setup
const {
  applyToJob,
  getApplicationsByJobId,
  getMyApplications,
  updateApplicationStatus
} = require('../controllers/jobApplication.controller');

// -----------------------------
// Routes
// -----------------------------

// Apply for a job with file upload (CV)
router.post('/apply', protect, upload.single('resumeFile'), applyToJob);

// Get all applications for a specific job (employer)
router.get('/job/:jobId/applications', protect, getApplicationsByJobId);

// Get all jobs the logged-in user has applied to
router.get('/my-applications', protect, getMyApplications);

//Toggle Job Status
router.patch('/:applicationId/status', protect, updateApplicationStatus);


module.exports = router;
