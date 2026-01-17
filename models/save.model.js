const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkilledJob',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SavedJob', savedJobSchema);
