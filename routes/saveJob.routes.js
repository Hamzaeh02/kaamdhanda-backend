const router = require('express').Router();
const protect = require('../middleware/auth.middleware');
const { savedJob, getSavedJobs } = require('../controllers/savedJob.controller');

// Get saved jobs for authenticated user
router.get('/getAllSavedJobs', protect, getSavedJobs);

// Save / Unsave job
router.post('/saveJob/:jobId', protect, savedJob);

module.exports = router;
