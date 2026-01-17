const Employer = require('../models/employer.model');
const User = require('../models/user.model');
const Worker = require('../models/worker.model');
const generateToken = require('../utils/generateToken');
const { sendResponse } = require('../utils/responseHandler');
const generateReferralCode = require('../utils/generateRefferals');

// Ensure unique referral codes for users
async function generateUniqueReferralCode() {
  let userReferralCode;
  let isUnique = false;

  while (!isUnique) {
    userReferralCode = generateReferralCode();
    const existingCode = await User.findOne({ userReferralCode });
    if (!existingCode) isUnique = true;
  }

  return userReferralCode;
}

// Register User
exports.registerUser = async (req, res) => {
  try {
    const {
      firstName, lastName, userName, email, referalCode, phoneNo,
      dateOfBirth, gender, role, password, jobTitle, skills,
      experince, highestEducation, description
    } = req.body;

    const files = req.files || {};
    const cnicFront = files.cnicFront ? files.cnicFront[0].path : null;
    const cnicBack = files.cnicBack ? files.cnicBack[0].path : null;
    const cvFile = files.cvFile ? files.cvFile[0].path : null;
    const profilePhoto = files.profilePhoto ? files.profilePhoto[0].path : null;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return sendResponse(res, {
        success: false,
        message: "User already exists",
        errors: null,
        statusCode: 409
      });

    // Generate unique referral code for the new user
    const userReferralCode = await generateUniqueReferralCode();

    // Signup bonus
    const SIGNUP_BONUS = 300;
    let balance = SIGNUP_BONUS;

 // If referred by someone, give bonus to the referrer
if (referalCode) {
  const referrer = await User.findOne({ userReferralCode: referalCode });
  if (referrer) {
    referrer.balance += 100; // Referral bonus
    await referrer.save();
    console.log(`Referral bonus added to ${referrer.email}. New balance: ${referrer.balance}`);
  } else {
    console.log(`Referral code ${referalCode} not found in DB`);
  }
}


    const user = new User({
      firstName, lastName, userName, email, referalCode: referalCode || null,
      userReferralCode, phoneNo, dateOfBirth, gender, password, role, balance,
      jobTitle, skills, experince, highestEducation, description,
      cnicFront, cnicBack, cvFile, profilePhoto
    });

    await user.save();

    const token = generateToken(user);

    // Remove password before sending response
    const userSafe = user.toObject();
    delete userSafe.password;

    sendResponse(res, {
      success: true,
      message: "User registered successfully",
      data: { token, user: userSafe },
      statusCode: 201
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0].message;
      return sendResponse(res, {
        success: false,
        message: "Validation failed",
        errors: firstError,
        statusCode: 422
      });
    }
    console.error(error);
    sendResponse(res, {
      success: false,
      message: "Server error",
      errors: error.message,
      statusCode: 500
    });
  }
};

// Register Employer
exports.registerEmployer = async (req, res) => {
  try {
    const {
      firstName, lastName, userName, email, referalCode, phoneNo,
      dateOfBirth, gender, password, role, companyName,
      companyAddress, companyContact, description
    } = req.body;

    const files = req.files || {};
    const cnicFront = files.cnicFront ? files.cnicFront[0].path : null;
    const cnicBack = files.cnicBack ? files.cnicBack[0].path : null;
    const cvFile = files.cvFile ? files.cvFile[0].path : null;
    const profilePhoto = files.profilePhoto ? files.profilePhoto[0].path : null;

    const existingEmployer = await Employer.findOne({ email });
    if (existingEmployer)
      return sendResponse(res, {
        success: false,
        message: "Employer already exists",
        errors: null,
        statusCode: 409
      });

    const employer = new Employer({
      firstName, lastName, userName, email, referalCode, phoneNo,
      dateOfBirth, gender, password, role, companyName,
      companyAddress, companyContact, description,
      cnicFront, cnicBack, cvFile, profilePhoto
    });

    await employer.save();
    const token = generateToken(employer);

    sendResponse(res, {
      success: true,
      message: "Employer registered successfully",
      data: { token, employer },
      statusCode: 201
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0].message;
      return sendResponse(res, {
        success: false,
        message: "Validation failed",
        errors: firstError,
        statusCode: 422
      });
    }
    console.error(error);
    sendResponse(res, {
      success: false,
      message: "Server error",
      errors: error.message,
      statusCode: 500
    });
  }
};
exports.sendOtp = async (req, res) => {
  try {
    const { email, phoneNo, type } = req.body;

    if (!type || !["user", "employer", "worker"].includes(type)) {
      return sendResponse(res, { success: false, message: "Invalid type", statusCode: 400 });
    }

    let account;

    if (type === "user") account = await User.findOne({ email });
    else if (type === "employer") account = await Employer.findOne({ email });
    else if (type === "worker") account = await Worker.findOne({ $or: [{ email }, { phoneNo }] });

    // Auto-create worker if not exists
    if (type === "worker" && !account) {
      account = new Worker({ email, phoneNo });
      await account.save();
    }

    if (!account) {
      return sendResponse(res, { success: false, message: `${type} not found`, statusCode: 404 });
    }

    // OTP resend limit 2 minutes
    const now = new Date();
    if (account.lastOtpRequest && (now - account.lastOtpRequest) < 2 * 60 * 1000) {
      return sendResponse(res, { success: false, message: "OTP already sent. Wait 2 minutes", statusCode: 429 });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    account.otp = otp;
    account.otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry
    account.lastOtpRequest = now;
    await account.save();

    console.log(`OTP for ${email || phoneNo}: ${otp}`); // for testing

    sendResponse(res, {
      success: true,
      message: "OTP sent successfully",
      data: { accountId: account._id, type, otp }, // otp for testing only
      statusCode: 200
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, { success: false, message: "Server error", errors: error.message, statusCode: 500 });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { accountId, otp, type } = req.body;

    if (!accountId || !otp || !type || !["user", "employer", "worker"].includes(type)) {
      return sendResponse(res, { success: false, message: "Missing or invalid fields", statusCode: 400 });
    }

    let account;
    if (type === "user") account = await User.findById(accountId);
    else if (type === "employer") account = await Employer.findById(accountId);
    else if (type === "worker") account = await Worker.findById(accountId);

    if (!account) return sendResponse(res, { success: false, message: `${type} not found`, statusCode: 404 });

    if (account.otp !== otp || account.otpExpiresAt < new Date()) {
      return sendResponse(res, { success: false, message: "Invalid or expired OTP", statusCode: 400 });
    }

    account.isVerified = true;
    account.otp = null;
    account.otpExpiresAt = null;
    await account.save();

    const token = generateToken(account);

    const accountSafe = account.toObject();
    delete accountSafe.password;

    sendResponse(res, {
      success: true,
      message: `${type} verified successfully`,
      data: { token, account: accountSafe, type },
      statusCode: 200
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, { success: false, message: "Server error", errors: error.message, statusCode: 500 });
  }
};


// Login Worker
exports.loginWorker = async (req, res) => {
  try {
    const { email, phoneNo } = req.body;

    if (!email && !phoneNo)
      return sendResponse(res, {
        success: false,
        message: "Email or phone number is required",
        statusCode: 400
      });

    // Check if worker exists
    let worker = await Worker.findOne({
      $or: [
        email ? { email } : null,
        phoneNo ? { phoneNo } : null
      ].filter(Boolean)
    });

    // Auto-create worker if not exists
    if (!worker) {
      const newData = {};
      if (email) newData.email = email;
      if (phoneNo) newData.phoneNo = phoneNo;

      worker = new Worker(newData);
      await worker.save();
    }

    // OTP resend limit: 2 min
    const now = new Date();
    if (worker.lastOtpRequest && (now - worker.lastOtpRequest) < 2 * 60 * 1000) {
      return sendResponse(res, {
        success: false,
        message: "OTP already sent. Please wait 2 minutes before requesting again",
        statusCode: 429
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    worker.otp = otp;
    worker.otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry
    worker.lastOtpRequest = now;
    await worker.save();

    // TODO: send OTP via SMS/Email
    console.log(`OTP for ${email || phoneNo}: ${otp}`);

    sendResponse(res, {
      success: true,
      message: "OTP sent successfully",
      data: { workerId: worker._id, otp }, // returning OTP in response for testing
      statusCode: 200
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, {
      success: false,
      message: "Server error",
      errors: error.message,
      statusCode: 500
    });
  }
};

// Verify Worker OTP
exports.verifyWorkerOtp = async (req, res) => {
  try {
    const { workerId, otp } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker)
      return sendResponse(res, { success: false, message: "Worker not found", statusCode: 404 });

    if (worker.otp !== otp || worker.otpExpiresAt < new Date())
      return sendResponse(res, { success: false, message: "Invalid or expired OTP", statusCode: 400 });

    worker.isVerified = true;
    worker.otp = null;
    worker.otpExpiresAt = null;
    await worker.save();

    const token = generateToken(worker);

    sendResponse(res, {
      success: true,
      message: "Login successful",
      data: { token, worker },
      statusCode: 200
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, { success: false, message: "Server error", errors: error.message, statusCode: 500 });
  }
};


// Login User/Employer
exports.loginUser = async (req, res) => {
  try {
    const { email, password, type } = req.body;

    if (type === "user") {
      const user = await User.findOne({ email });
      if (!user)
        return sendResponse(res, { success: false, message: "Invalid email or password", errors: null, statusCode: 400 });

      const isMatch = await user.matchPassword(password);
      if (!isMatch)
        return sendResponse(res, { success: false, message: "Invalid email or password", errors: null, statusCode: 400 });

      const token = generateToken(user);
      const userSafe = user.toObject();
      delete userSafe.password;

      return sendResponse(res, { success: true, message: "User logged in successfully", data: { token, user: userSafe }, statusCode: 200 });

    } else if (type === "employer") {
      const employer = await Employer.findOne({ email });
      if (!employer)
        return sendResponse(res, { success: false, message: "Invalid email or password", errors: null, statusCode: 400 });

      const isMatch = await employer.matchPassword(password);
      if (!isMatch)
        return sendResponse(res, { success: false, message: "Invalid email or password", errors: null, statusCode: 400 });

      const token = generateToken(employer);
      const employerSafe = employer.toObject();
      delete employerSafe.password;

      return sendResponse(res, { success: true, message: "Employer logged in successfully", data: { token, employer: employerSafe }, statusCode: 200 });

    } else {
      return sendResponse(res, { success: false, message: "Invalid type provided", errors: null, statusCode: 400 });
    }

  } catch (error) {
    console.error(error);
    sendResponse(res, { success: false, message: "Server error", errors: error.message, statusCode: 500 });
  }
};
