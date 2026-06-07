const multer = require("multer");
const { ErrorResponse } = require("./errorHandler");

/**
 * Multer Memory Storage
 * Files are stored as Buffer in req.file.buffer — no disk writes.
 * This allows piping directly to Cloudinary upload stream.
 */
const storage = multer.memoryStorage();

/** Allow only JPEG, PNG, WebP for profile photos */
const photoFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse("Only JPEG, PNG, or WebP images are allowed", 400), false);
  }
};

/** Allow only PDF for resumes */
const resumeFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new ErrorResponse("Only PDF files are allowed for resume", 400), false);
  }
};

/** Profile photo upload — max 2MB */
const uploadPhoto = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: photoFileFilter,
});

/** Resume upload — max 5MB */
const uploadResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: resumeFileFilter,
});

module.exports = { uploadPhoto, uploadResume };
