import multer from 'multer';
const storage = multer.memoryStorage();
const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const fileFilter = (req, file, callback) => {
  if (allowedTypes.includes(file.mimetype)) return callback(null, true);
  const error = new Error('Resume must be a PDF, DOC, or DOCX file');
  error.statusCode = 400;
  callback(error);
};
export const uploadResume = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('resume');


// Separate image upload middleware; existing resume upload remains unchanged.
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const imageFileFilter = (req, file, callback) => {
  if (allowedImageTypes.includes(file.mimetype)) return callback(null, true);
  const error = new Error('Profile picture must be JPG, PNG, or WEBP');
  error.statusCode = 400;
  callback(error);
};
export const uploadProfilePicture = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');
