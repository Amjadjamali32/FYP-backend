import multer from "multer";

const storage = multer.memoryStorage(); 

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const fileUploadMiddleware = upload.fields([
  { name: 'NICImage', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 },
  { name: 'signatureImage', maxCount: 1 },
  { name: 'evidenceFiles', maxCount: 10 },
]);