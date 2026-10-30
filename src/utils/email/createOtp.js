import crypto from "crypto";
import { createClient } from "redis";

let redisClient = null;

export async function getRedis() {
  if (redisClient && redisClient.isOpen) return redisClient;

  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on("error", (err) => console.error("Redis error:", err.message));
  await redisClient.connect();
  console.log("Redis connected");
  return redisClient;
}

function otpKey(email, purpose) {
  return `otp:${purpose}:${String(email).toLowerCase()}`;
}

export function otpTtlSeconds() {
  const ttl = Number(process.env.OTP_EXPIRY_SECONDS || 300);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 300;
}

export function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function storeOtp(email, purpose, otp) {
  const redis = await getRedis();
  await redis.set(otpKey(email, purpose), otp, { EX: otpTtlSeconds() });
}

export async function verifyOtpOnce(email, purpose, otp) {
  const redis = await getRedis();
  const stored = await redis.get(otpKey(email, purpose));
  if (!stored || stored !== String(otp)) return false;
  await redis.del(otpKey(email, purpose));
  return true;
}

export const OTP_PURPOSES = {
  CONFIRM: "email-confirm",
  RESET: "password-reset",
};
