const Employer = require('../models/employer.model');
const User = require('../models/user.model');
const Worker = require('../models/worker.model');
const generateToken = require('../utils/generateToken');
const { sendResponse } = require('../utils/responseHandler');
const generateReferralCode = require('../utils/generateRefferals');
const jwt = require('jsonwebtoken'); 



// Helper to convert file paths to full URLs
function getFullFileUrl(req, filePath) {
  if (!filePath) return null;
  return `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/')}`;
}

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
// ---------------- Generate & Save OTP ----------------
const generateAndSaveOtp = async (account) => {
  const now = new Date();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  account.otp = otp;
  account.otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry
  account.lastOtpRequest = now;
  await account.save();

  console.log(`OTP for ${account.email}: ${otp}`);
  return otp;
};



// ---------------- Register User ----------------
exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, referalCode, phoneNo, dateOfBirth, gender, role, password, jobTitle, skills, experince, highestEducation, description } = req.body;

    const files = req.files || {};
    const cnicFront = getFullFileUrl(req, files.cnicFront?.[0]?.path);
    const cnicBack = getFullFileUrl(req, files.cnicBack?.[0]?.path);
    const cvFile = getFullFileUrl(req, files.cvFile?.[0]?.path);
    const profilePhoto = getFullFileUrl(req, files.profilePhoto?.[0]?.path);

    if (await User.findOne({ email })) 
      return sendResponse(res, { success: false, message: "User already exists", statusCode: 409 });

    const userReferralCode = await generateUniqueReferralCode();
    let balance = 300; // signup bonus

    if (referalCode) {
      const referrer = await User.findOne({ userReferralCode: referalCode });
      if (referrer) {
        referrer.balance += 100;
        await referrer.save();
      }
    }

    const user = new User({
      firstName, lastName, userName, email, referalCode: referalCode || null,
      userReferralCode, phoneNo, dateOfBirth, gender, password, role, balance,
      jobTitle, skills, experince, highestEducation, description,
      cnicFront, cnicBack, cvFile, profilePhoto
    });

    const otp = await generateAndSaveOtp(user);
    const token = generateToken(user);

    const userSafe = user.toObject();
    delete userSafe.password;

    sendResponse(res, {
      success: true,
      message: "User registered successfully and OTP sent",
      data: { token, user: userSafe, otp },
      statusCode: 201
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, { success: false, message: "Server error", errors: error.message, statusCode: 500 });
  }
};

// ---------------- Register Employer ----------------
exports.registerEmployer = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, referalCode, phoneNo, dateOfBirth, gender, password, role, companyName, companyAddress, companyContact, description } = req.body;

    const files = req.files || {};
    const cnicFront = getFullFileUrl(req, files.cnicFront?.[0]?.path);
    const cnicBack = getFullFileUrl(req, files.cnicBack?.[0]?.path);
    const cvFile = getFullFileUrl(req, files.cvFile?.[0]?.path);
    const profilePhoto = getFullFileUrl(req, files.profilePhoto?.[0]?.path);

    if (await Employer.findOne({ email })) 
      return sendResponse(res, { success: false, message: "Employer already exists", statusCode: 409 });

    const employer = new Employer({
      firstName, lastName, userName, email, referalCode, phoneNo,
      dateOfBirth, gender, password, role, companyName, companyAddress, companyContact, description,
      cnicFront, cnicBack, cvFile, profilePhoto
    });

    const otp = await generateAndSaveOtp(employer);
    const token = generateToken(employer);

    const employerSafe = employer.toObject();
    delete employerSafe.password;

    sendResponse(res, {
      success: true,
      message: "Employer registered successfully and OTP sent",
      data: { token, employer: employerSafe, otp },
      statusCode: 201
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, { success: false, message: "Server error", errors: error.message, statusCode: 500 });
  }
};

// ---------------- Unified OTP Verification ----------------
exports.verifyOtp = async (req, res) => {
  try {
    const { accountId, otp, type } = req.body;
    if (!accountId || !otp || !type || !['user', 'employer'].includes(type)) {
      return sendResponse(res, { success: false, message: 'Missing or invalid fields', statusCode: 400 });
    }

    const accountModel = type === 'user' ? User : Employer;
    const account = await accountModel.findById(accountId);
    if (!account) return sendResponse(res, { success: false, message: `${type} not found`, statusCode: 404 });

    if (account.otp !== otp || account.otpExpiresAt < new Date()) 
      return sendResponse(res, { success: false, message: 'Invalid or expired OTP', statusCode: 400 });

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
    sendResponse(res, { success: false, message: 'Server error', errors: error.message, statusCode: 500 });
  }
};


// ------------------ Login Worker (passwordless) ------------------
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

      // Assign unique referral code if needed
      newData.userReferralCode = await generateUniqueReferralCode();

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
      data: { 
        workerId: worker._id, 
        otp, 
        balance: worker.balance || 0, 
        phoneNo: worker.phoneNo || null
      },
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


// ------------------ Add Referral Code for Worker ------------------
exports.addWorkerReferral = async (req, res) => {
  try {
    const { workerId, referalCode } = req.body;

    if (!referalCode) {
      return sendResponse(res, {
        success: false,
        message: "Referral code is required",
        statusCode: 400
      });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return sendResponse(res, {
        success: false,
        message: "Worker not found",
        statusCode: 404
      });
    }

    if (worker.referalCode) {
      return sendResponse(res, {
        success: false,
        message: "Referral code already applied",
        statusCode: 400
      });
    }

    const referrer = await Worker.findOne({ userReferralCode: referalCode });
    if (!referrer) {
      return sendResponse(res, {
        success: false,
        message: "Invalid referral code",
        statusCode: 400
      });
    }

    // Apply referral: ONLY referrer gets bonus
    worker.referalCode = referalCode;
    await worker.save();

    referrer.balance += 100; // referrer gets 100 points
    await referrer.save();

    sendResponse(res, {
      success: true,
      message: "Referral applied successfully",
      data: { referrerBalance: referrer.balance }, // only referrer balance shown
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


// 1. Forgot Password - Sirf OTP generate aur send karega
exports.forgotPassword = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type || !['user', 'employer'].includes(type)) {
      return sendResponse(res, { success: false, message: "Email and valid type are required", statusCode: 400 });
    }

    const Model = type === 'user' ? User : Employer;
    const account = await Model.findOne({ email });

    if (!account) {
      return sendResponse(res, { success: false, message: "Account not found", statusCode: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    account.otp = otp;
    account.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await account.save();

    console.log(`Reset OTP for ${email}: ${otp}`);

    return sendResponse(res, {
      success: true,
      message: "OTP sent successfully",
      data: { otp }, // Testing ke liye
      statusCode: 200,
    });
  } catch (error) {
    sendResponse(res, { success: false, message: "Server error", errors: error.message, statusCode: 500 });
  }
};

// 2. Verify OTP - Sahi hone par Reset Token dega
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp, type } = req.body; // type: 'user' or 'employer'

    if (!email || !otp || !type) {
      return sendResponse(res, { success: false, message: "All fields are required", statusCode: 400 });
    }

    const Model = type === 'user' ? User : Employer;
    const account = await Model.findOne({ 
      email, 
      otp, 
      otpExpire: { $gt: Date.now() } 
    });

    if (!account) {
      return sendResponse(res, { success: false, message: "Invalid or expired OTP", statusCode: 400 });
    }

    // Aapka existing generateToken call kar rahe hain
    // Ye token 7 din ya process.env.JWT_EXPIRE tak valid hoga
    const resetToken = generateToken(account);

    return sendResponse(res, {
      success: true,
      message: "OTP verified successfully",
      data: { resetToken, type }, // 'type' frontend ko wapis bhej rahe hain reset ke liye
      statusCode: 200,
    });
  } catch (error) {
    sendResponse(res, { success: false, message: "Server error", errors: error.message, statusCode: 500 });
  }
};

// ---------------- Reset Password (Using JWT Payload) ----------------
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password, confirmPassword } = req.body;

    // 1. Basic Validation
    if (!resetToken || !password || !confirmPassword) {
      return sendResponse(res, { success: false, message: "All fields are required", statusCode: 400 });
    }

    if (password !== confirmPassword) {
      return sendResponse(res, { success: false, message: "Passwords do not match", statusCode: 400 });
    }

    // 2. Token Verify karein
    // Note: jwt.verify aapke JWT_SECRET se decode karega jo generateToken ne use kiya tha
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    // 3. Role ke mutabiq Model select karein
    // Aapke model mein role 'user' ya 'employer' hota hai
    let Model;
    if (decoded.role === 'employer') {
      Model = Employer;
    } else {
      Model = User;
    }

    // 4. Account dhundein
    const account = await Model.findById(decoded.id);

    if (!account) {
      return sendResponse(res, { 
        success: false, 
        message: "Account not found or invalid token", 
        statusCode: 404 
      });
    }

    // 5. Password Update
    // Mongoose pre-save hook automatically password ko hash kar dega
    account.password = password;
    
    // OTP fields clear karna zaroori hai reset ke baad
    account.otp = null;
    account.otpExpire = null;
    
    await account.save();

    return sendResponse(res, {
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
      statusCode: 200,
    });

  } catch (error) {
    console.error("Reset Password Error:", error.message);
    
    // Agar token expire ho gaya ho ya tampered ho
    return sendResponse(res, { 
      success: false, 
      message: "Invalid or expired reset token", 
      errors: error.message, 
      statusCode: 401 
    });
  }
};