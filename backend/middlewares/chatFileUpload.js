import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import multer from "multer";

const uploadDirectory = fileURLToPath(new URL("../uploads/chat-files/", import.meta.url));
const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["application/pdf", ".pdf"],
  ["text/plain", ".txt"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["application/vnd.ms-excel", ".xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"],
  ["application/vnd.ms-powerpoint", ".ppt"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx"],
]);
const allowedExtensions = new Map(Array.from(allowedTypes, ([mimeType, extension]) => [extension, mimeType]));

mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      const extension = allowedTypes.get(file.mimetype)
        ? allowedTypes.get(file.mimetype)
        : path.extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.has(file.mimetype) && !allowedExtensions.has(extension)) {
      callback(new Error("Choose an image, PDF, or common Office/text document"));
      return;
    }
    callback(null, true);
  },
}).single("attachment");

const uploadChatFile = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Attachments must be 10 MB or smaller" });
    }

    if (error instanceof multer.MulterError || error.message.includes("Choose an image")) {
      return res.status(400).json({ message: error.message });
    }

    return next(error);
  });
};

export default uploadChatFile;
