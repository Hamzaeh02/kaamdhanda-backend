const Task = require('../models/task.model');
const { sendResponse } = require('../utils/responseHandler');

// ============================
// Create a New Task
// ============================
exports.createTask = async (req, res) => {
  try {
    const {
      jobTitle,
      jobDescription,
      budget,
      contactNumber,
      selectCategory,
      address,
      lattitude,
      longitude,
    } = req.body;

    // Multer files
    let galleryImages = [];
    if (req.files && req.files.length > 0) {
      galleryImages = req.files.map(file => file.path); // DB me path store hoga
    }

    const task = new Task({
      jobTitle,
      jobDescription,
      budget,
      contactNumber,
      selectCategory,
      galleryImages, // uploaded files
      address,
      lattitude,
      longitude,
      user: req.user.id,
    });

    await task.save();

    return sendResponse(res, {
      success: true,
      message: 'Task created successfully',
      data: task,
      statusCode: 201,
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


// ============================
// Get All Tasks
// ============================
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find();

    return sendResponse(res, {
      success: true,
      message: 'Tasks fetched successfully',
      data: tasks,
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

// ============================
// Get Task By ID
// ============================
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return sendResponse(res, {
        success: false,
        message: 'Task not found',
        statusCode: 404,
      });
    }

    return sendResponse(res, {
      success: true,
      message: 'Task fetched successfully',
      data: task,
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

// ============================
// Get My Tasks
// ============================
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });

    return sendResponse(res, {
      success: true,
      message: 'My tasks fetched successfully',
      data: tasks,
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

// ============================
// Update Task
// ============================
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!task) {
      return sendResponse(res, {
        success: false,
        message: 'Task not found',
        statusCode: 404,
      });
    }

    return sendResponse(res, {
      success: true,
      message: 'Task updated successfully',
      data: task,
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

// ============================
// Delete Task
// ============================
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return sendResponse(res, {
        success: false,
        message: 'Task not found',
        statusCode: 404,
      });
    }

    return sendResponse(res, {
      success: true,
      message: 'Task deleted successfully',
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
