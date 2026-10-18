import multer from 'multer';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Kept in memory (req.file.buffer) just long enough to send it to Cloudinary
export const upload = multer({
  storage: multer.memoryStorage(),
  defParamCharset: 'utf8',
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});
