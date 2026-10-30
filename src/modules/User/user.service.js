import jwt from "jsonwebtoken";
import User from "../../DB/models/user.model.js";
import { hashPassword, comparePassword } from "../../utils/security/hash.js";
import { createOtp, storeOtp, verifyOtpOnce, OTP_PURPOSES } from "../../utils/email/createOtp.js";
import { sendEmail } from "../../utils/email/sendEmail.js";
import { buildOtpTemplate } from "../../utils/email/emailTemplate.js";
import { publicUser } from "./user.types.js";

function signAccessToken(userId) {
  return jwt.sign(
    { userId, tokenType: "access" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
}

function signRefreshToken(userId) {
  return jwt.sign(
    { userId, tokenType: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
}

function tokensFor(userId) {
  return { accessToken: signAccessToken(userId), refreshToken: signRefreshToken(userId) };
}

export async function registerUser({ name, email, password }) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const err = new Error("Email is already registered");
    err.status = 409;
    throw err;
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    isEmailConfirmed: false,
  });

  const otp = createOtp();
  await storeOtp(user.email, OTP_PURPOSES.CONFIRM, otp);

  try {
    const emailData = buildOtpTemplate(user.email, otp, OTP_PURPOSES.CONFIRM);
    await sendEmail(emailData.to, emailData.subject, emailData.text);
  } catch (emailError) {
    console.error("Failed to send confirmation email:", emailError.message);
  }

  return { message: "Registration successful. Please check your email for the confirmation OTP.", user: publicUser(user) };
}

export async function confirmEmail({ email, otp }) {
  const normalizedEmail = email.toLowerCase();
  const ok = await verifyOtpOnce(normalizedEmail, OTP_PURPOSES.CONFIRM, otp);
  if (!ok) {
    const err = new Error("OTP has expired or is invalid");
    err.status = 400;
    throw err;
  }

  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { isEmailConfirmed: true },
    { returnDocument: "after" }
  );
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return { message: "Email confirmed successfully", user: publicUser(user) };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  if (!user.isEmailConfirmed) {
    const err = new Error("Please confirm your email before logging in");
    err.status = 403;
    throw err;
  }

  return { user: publicUser(user), ...tokensFor(user._id) };
}

export async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error("Invalid or expired refresh token");
    err.status = 401;
    throw err;
  }

  if (decoded.tokenType !== "refresh") {
    const err = new Error("Invalid token type");
    err.status = 401;
    throw err;
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (user.passwordChangedAt) {
    const changedAtTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (decoded.iat < changedAtTimestamp) {
      const err = new Error("Password was changed. Please log in again.");
      err.status = 401;
      throw err;
    }
  }

  return { accessToken: signAccessToken(user._id) };
}

export async function forgetPassword({ email }) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const otp = createOtp();
    await storeOtp(normalizedEmail, OTP_PURPOSES.RESET, otp);

    try {
      const emailData = buildOtpTemplate(user.email, otp, OTP_PURPOSES.RESET);
      await sendEmail(emailData.to, emailData.subject, emailData.text);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError.message);
    }
  }

  return { message: "If this email is registered, you will receive a password reset OTP." };
}

export async function resetPassword({ email, otp, newPassword }) {
  const normalizedEmail = email.toLowerCase();
  const ok = await verifyOtpOnce(normalizedEmail, OTP_PURPOSES.RESET, otp);
  if (!ok) {
    const err = new Error("OTP has expired or is invalid");
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  user.password = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();

  return { message: "Password has been reset successfully. Please log in with your new password." };
}

export async function updateProfileImage(userId, filePath) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  user.profileImage = filePath;
  await user.save();
  return { user: publicUser(user) };
}

export async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return { user: publicUser(user) };
}
