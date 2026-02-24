const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const protect = require('../middleware/auth.middleware');
const {
  registerUser,
  registerEmployer,
  loginUser,
  loginWorker,
  verifyOtp,
  addWorkerReferral,
  verifyWorkerOtp,
  forgotPassword,
  resetPassword,
  verifyResetOtp, 
} = require('../controllers/auth.controller');

// =======================
// Registration routes
// =======================
router.post(
  '/register',
  upload.fields([
    { name: 'cnicFront' },
    { name: 'cnicBack' },
    { name: 'cvFile' },
    { name: 'profilePhoto' },
  ]),
  registerUser
);

router.post(
  '/register-employer',
  upload.fields([
    { name: 'cnicFront' },
    { name: 'cnicBack' },
    { name: 'cvFile' },
    { name: 'profilePhoto' },
  ]),
  registerEmployer
);

// =======================
// Existing login routes
// =======================
router.post('/login', loginUser);
router.post('/login-worker', loginWorker);

// =======================
// OTP login / verification routes
// =======================
// router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

// =======================
// ✅ Worker Referral Route (ADDED ONLY)
// =======================
router.post(
  '/worker/add-referral',
  protect,
  addWorkerReferral
);

router.post(
  '/worker/verify-otp',
  verifyWorkerOtp
);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-otp', verifyResetOtp);

module.exports = router;
