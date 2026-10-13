import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Outside public/ so files can't be reached by URL, only through our routes
export const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// With `dest`, Multer saves each file under a random name with no extension,
// so names never clash and user input never ends up in a disk path
export const upload = multer({
  dest: UPLOADS_DIR,
  defParamCharset: 'utf8',
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});
