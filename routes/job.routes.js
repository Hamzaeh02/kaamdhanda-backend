const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { createJob, getAllJobs,getAllRecommendedJobs, getJobById,getMyEmployerJobs,toggleJobStatus,updateJob,deleteJob,getClosedJobs} = require('../controllers/skilledjob.controller');
const { route } = require('./auth.routes');
// Create a new job posting
router.post('/createJob', protect, createJob);
// Get all job postings
router.get('/getAllJobs', getAllJobs);
// Get all recommended job postings
router.get('/getAllRecommendedJobs', getAllRecommendedJobs);
// Get a single job posting by ID
router.get('/getJobById/:id', getJobById);
// Get jobs posted by the authenticated employer
router.get('/getMyEmployerJobs', protect, getMyEmployerJobs);
// Toggle job status
router.put('/toggleJobStatus/:id', protect, toggleJobStatus);
// Update a job posting by ID
router.put('/updateJob/:id', protect, updateJob);
// Delete a job posting by ID
router.delete('/deleteJob/:id', protect, deleteJob);

// // Toggle isSaved status of a job posting by ID
// router.put('/toggleJobSaved/:id', protect, toggleJobSaved);

router.get('/getClosedJobs', getClosedJobs);

module.exports = router;



