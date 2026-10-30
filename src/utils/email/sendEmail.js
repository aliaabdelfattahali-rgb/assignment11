import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Saraha App" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
    });
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
