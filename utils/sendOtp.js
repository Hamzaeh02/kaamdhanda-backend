async function sendOtpToAccount(account) {
  const now = new Date();

  // Resend limit: 2 minutes
  if (account.lastOtpRequest && (now - account.lastOtpRequest) < 2 * 60 * 1000) {
    throw new Error("OTP already sent. Please wait 2 minutes.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  account.otp = otp;
  account.otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min
  account.lastOtpRequest = now;
  await account.save();

  // TODO: send via SMS / email
  console.log(`OTP for ${account.email || account.phoneNo}: ${otp}`);
  return otp;
}
