import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Prefix with timestamp for uniqueness
  }
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
});

export const fileUploadMiddleware = upload.fields([
  { name: 'NICImage', maxCount: 1 },          // Single NIC image
  { name: 'profileImage', maxCount: 1 },     // Single profile image
  { name: 'signatureImage', maxCount: 1 },   // Single signature image
  { name: 'evidenceFiles', maxCount: 10 },         // Up to 10 evidence files
]);
