const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const upload = require('../middleware/upload'); // your current multer setup
const {
  applyToJob,
  getApplicationsByJobId,
  getMyApplications
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

module.exports = router;
