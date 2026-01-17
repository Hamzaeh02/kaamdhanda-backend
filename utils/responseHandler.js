// utils/responseHandler.js
exports.sendResponse = (res, { success, message, errors = null, data = null, statusCode }) => {
  res.status(statusCode).json({
    success,
    message,
    errors,
    data,
    statusCode,
  });
};