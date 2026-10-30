import express from "express";
import { connectDB } from "./DB/DB.connection.js";
import { getRedis } from "./utils/email/createOtp.js";
import { userRouter } from "./modules/User/user.controller.js";

export async function bootstrap(app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  await connectDB(process.env.MONGO_URI);
  await getRedis();

  app.use("/api/user", userRouter);

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  });
}
