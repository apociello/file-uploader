import { Router } from 'express';
import { uploadFile } from '../controllers/fileController.js';
import { ensureAuthenticated } from '../middlewares/middleware.js';
import { upload } from '../config/multer.js';

const router = Router();

router.post('/files', ensureAuthenticated, upload.single('file'), uploadFile);

export default router;
