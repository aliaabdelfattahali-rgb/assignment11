const emailFormat = /^\S+@\S+\.\S+$/;

export const registerSchema = {
  name: { required: true, type: "string", minLength: 2 },
  email: { required: true, type: "string", format: "email" },
  password: { required: true, type: "string", minLength: 6 },
  confirmPassword: { required: true, type: "string", minLength: 6, matches: "password" },
};

export const confirmEmailSchema = {
  email: { required: true, type: "string", format: "email" },
  otp: { required: true, type: "string", minLength: 6 },
};

export const loginSchema = {
  email: { required: true, type: "string", format: "email" },
  password: { required: true, type: "string", minLength: 1 },
};

export const refreshTokenSchema = {
  refreshToken: { required: true, type: "string", minLength: 1 },
};

export const forgetPasswordSchema = {
  email: { required: true, type: "string", format: "email" },
};

export const resetPasswordSchema = {
  email: { required: true, type: "string", format: "email" },
  otp: { required: true, type: "string", minLength: 6 },
  newPassword: { required: true, type: "string", minLength: 6 },
  confirmNewPassword: { required: true, type: "string", minLength: 6, matches: "newPassword" },
};

export { emailFormat };
