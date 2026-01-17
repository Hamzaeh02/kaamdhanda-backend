const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { createJob, getAllJobs, getJobById, getMyJobs,updateJob,deleteJob} = require('../controllers/skilledjob.controller');
// Create a new job posting
router.post('/createJob', protect, createJob);
// Get all job postings
router.get('/getAllJobs', getAllJobs);
// Get a single job posting by ID
router.get('getJobById/:id', getJobById);
// Get jobs posted by the authenticated user
router.get('/getMyJobs', protect, getMyJobs);
// Update a job posting by ID
router.put('/updateJob/:id', protect, updateJob);
// Delete a job posting by ID
router.delete('/deleteJob/:id', protect, deleteJob);


module.exports = router;