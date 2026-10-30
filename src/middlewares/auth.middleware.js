import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import User from "../DB/models/user.model.js";

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Bearer access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized: invalid or expired token" });
  }
}

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!file.mimetype.startsWith("image/") || !allowed.includes(ext)) {
    return cb(new Error("Only image files (png, jpg, jpeg, webp, gif) are allowed"));
  }
  cb(null, true);
}

export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
