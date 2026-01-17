const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const uploadGallery = require('../middleware/galleryImages');
const {
  createTask,
  getAllTasks,
  getTaskById,
  getMyTasks,
  updateTask,
  deleteTask
} = require('../controllers/task.controller');

// // Create a new task posting with gallery images
// router.post('/createTask', protect, upload.fields([{ name: 'galleryImages', maxCount: 3 }]), createTask);
router.post('/createTask', protect, uploadGallery, createTask);


// Get all task postings
router.get('/getAllTasks', getAllTasks);

// Get a single task posting by ID
router.get('/getTaskById/:id', getTaskById);

// Get tasks posted by the authenticated user
router.get('/getMyTasks', protect, getMyTasks);

// Update a task posting by ID
router.put('/updateTask/:id', protect, updateTask);

// Delete a task posting by ID
router.delete('/deleteTask/:id', protect, deleteTask);

module.exports = router;
