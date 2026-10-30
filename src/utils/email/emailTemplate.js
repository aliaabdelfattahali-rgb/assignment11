export function buildOtpTemplate(to, otp, purpose) {
  const minutes = Math.ceil(Number(process.env.OTP_EXPIRY_SECONDS || 300) / 60);

  if (purpose === "email-confirm") {
    return {
      to,
      subject: "Saraha: confirm your email",
      text: `Your email confirmation code is: ${otp}. It expires in ${minutes} minutes.`,
    };
  }

  return {
    to,
    subject: "Saraha: password reset code",
    text: `Your password reset code is: ${otp}. It expires in ${minutes} minutes.`,
  };
}
