const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employerSchema = new mongoose.Schema({

    // Personal Information
    firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  userName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  referalCode: { type: String, trim: true, default: null },
  phoneNo: { type: Number, required: true, unique: true,},
  dateOfBirth: { type: Date, required: true, },
  gender: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employer'], required: true },

  //Company Information
  companyName: { type: String, required: true, trim: true },
  companyAddress: { type: String, required: true, trim: true },
  companyContact: { type: Number, required: true, unique: true,},
  description: { type: String, required: true, trim: true },

  // Uploaded files
  profilePhoto: { type: String, default: null },
  cnicFront: { type: String, default: null },
  cnicBack: { type: String, default: null },
  cvFile: { type: String, default: null },
}, { timestamps: true });

employerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

employerSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const Employer = mongoose.model('Employer', employerSchema);
module.exports = Employer;