const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  registerUser,
  registerEmployer,
  loginUser,
  loginWorker,       // keep existing Worker login route
  sendOtp,
  verifyOtp
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
router.post('/login', loginUser);          // user/employer email-password login
router.post('/login-worker', loginWorker); // existing Worker login

// =======================
// OTP login / verification routes (all types: User, Employer, Worker)
// =======================
router.post('/otp/send', sendOtp);       // send OTP
router.post('/otp/verify', verifyOtp);   // verify OTP

module.exports = router;
