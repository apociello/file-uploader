import { Router } from 'express';
import { uploadFile, downloadFile } from '../controllers/fileController.js';
import { ensureAuthenticated } from '../middlewares/middleware.js';
import { upload } from '../config/multer.js';

const router = Router();

router.post('/files', ensureAuthenticated, upload.single('file'), uploadFile);
router.get('/files/:id/download', ensureAuthenticated, downloadFile);

export default router;
