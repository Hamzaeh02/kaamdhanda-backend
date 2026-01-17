const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  // Contact info (either can be null)
  email: { type: String, unique: true, sparse: true, trim: true },
  phoneNo: { type: String, unique: true, sparse: true, trim: true },

  // Verification
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  lastOtpRequest: { type: Date, default: null }, // OTP resend limit

  // Optional personal info
  firstName: { type: String, trim: true, default: null },
  lastName: { type: String, trim: true, default: null },
  userName: { type: String, unique: true, trim: true, default: null },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, trim: true, default: null },

  // Optional professional info
  jobTitle: { type: String, trim: true, default: null },
  skills: { type: [String], default: [] },
  experince: { type: String, trim: true, default: null },
  highestEducation: { type: String, trim: true, default: null },
  description: { type: String, trim: true, default: null },

  // Optional files
  profilePhoto: { type: String, default: null },
  cnicFront: { type: String, default: null },
  cnicBack: { type: String, default: null },
  cvFile: { type: String, default: null },

  // Referral
  referalCode: { type: String, trim: true, default: null }
}, { timestamps: true });

const Worker = mongoose.model('Worker', workerSchema);
module.exports = Worker;
