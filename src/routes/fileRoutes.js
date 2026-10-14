import { Router } from 'express';
import multer from 'multer';
import { uploadFile, downloadFile, deleteFile } from '../controllers/fileController.js';
import { ensureAuthenticated } from '../middlewares/middleware.js';
import { upload } from '../config/multer.js';

const router = Router();

router.post('/files', ensureAuthenticated, upload.single('file'), uploadFile);
router.get('/files/:id/download', ensureAuthenticated, downloadFile);
router.post('/files/:id/delete', ensureAuthenticated, deleteFile);

// Fallback for upload errors the browser check didn't catch (e.g. JS disabled)
router.use((err, req, res, next) => {
  if (!(err instanceof multer.MulterError)) return next(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).render('error', { message: 'File is too large' });
  }
  res.status(400).render('error', { message: 'Invalid upload' });
});

export default router;
