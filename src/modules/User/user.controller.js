import { Router } from "express";
import { auth, uploadProfileImage } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import * as service from "./user.service.js";
import {
  registerSchema,
  confirmEmailSchema,
  loginSchema,
  refreshTokenSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
} from "./user.validation.js";

export const userRouter = Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

userRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await service.registerUser(req.body);
    res.status(201).json({ success: true, message: result.message, user: result.user });
  })
);

userRouter.post(
  "/confirm-email",
  validate(confirmEmailSchema),
  asyncHandler(async (req, res) => {
    const result = await service.confirmEmail(req.body);
    res.json({ success: true, message: result.message, user: result.user });
  })
);

userRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await service.loginUser(req.body);
    res.json({ success: true, message: "Login successful", ...result });
  })
);

userRouter.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const result = await service.refreshAccessToken(req.body.refreshToken);
    res.json({ success: true, message: "Token refreshed", ...result });
  })
);

userRouter.post(
  "/forget-password",
  validate(forgetPasswordSchema),
  asyncHandler(async (req, res) => {
    await service.forgetPassword(req.body);
    res.json({ success: true, message: "If this email is registered, you will receive a password reset OTP." });
  })
);

userRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await service.resetPassword(req.body);
    res.json({ success: true, message: result.message });
  })
);

userRouter.put(
  "/profile-image",
  auth,
  (req, res, next) => {
    uploadProfileImage.single("profileImage")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }
    const result = await service.updateProfileImage(req.user.id, `uploads/${req.file.filename}`);
    res.json({ success: true, message: "Profile image updated", ...result });
  })
);

userRouter.get(
  "/profile",
  auth,
  asyncHandler(async (req, res) => {
    const result = await service.getProfile(req.user.id);
    res.json({ success: true, message: "Profile retrieved", ...result });
  })
);
