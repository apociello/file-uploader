import { Router } from 'express';
import { uploadFile, downloadFile, deleteFile } from '../controllers/fileController.js';
import { ensureAuthenticated } from '../middlewares/middleware.js';
import { upload } from '../config/multer.js';

const router = Router();

router.post('/files', ensureAuthenticated, upload.single('file'), uploadFile);
router.get('/files/:id/download', ensureAuthenticated, downloadFile);
router.post('/files/:id/delete', ensureAuthenticated, deleteFile);

export default router;
