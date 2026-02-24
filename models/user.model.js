const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Personal Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  userName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  referalCode: { type: String, trim: true, default: null },
  userReferralCode: { type: String, unique: true },
  phoneNo: { type: Number, required: true, unique: true,},
  dateOfBirth: { type: Date, required: true, },
  gender: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'worker', 'employeer'], required: true },
  balance: { type: Number, default: 0 },



  //Skills and Qualifications
  jobTitle: { type: String, required: true, trim: true },
    skills: { type: [String], required: true },
    experince: { type: String, required: true, trim: true },
    highestEducation: { type: String, required: true, trim: true }, 
    description: { type: String, required: true, trim: true },

  // Uploaded files
  profilePhoto: { type: String, default: null },
  cnicFront: { type: String, default: null },
  cnicBack: { type: String, default: null },
  cvFile: { type: String, default: null },

  otp: { type: String },
  otpExpire: { type: Date },

}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
