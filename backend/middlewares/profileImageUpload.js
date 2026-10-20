import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";

const uploadDirectory = fileURLToPath(new URL("../uploads/profile-images/", import.meta.url));
const imageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${imageTypes.get(file.mimetype)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!imageTypes.has(file.mimetype)) {
      callback(new Error("Profile photos must be JPEG, PNG, or WebP images"));
      return;
    }
    callback(null, true);
  },
}).single("profileImage");

const uploadProfileImage = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Profile photos must be 5 MB or smaller" });
    }

    if (error instanceof multer.MulterError || error.message.includes("Profile photos")) {
      return res.status(400).json({ message: error.message });
    }

    return next(error);
  });
};

export default uploadProfileImage;
