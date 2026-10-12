import { Router } from 'express';
import { dashboard, showFolder, createFolder, renameFolder, deleteFolder } from '../controllers/folderController.js';
import { ensureAuthenticated } from '../middlewares/middleware.js';

const router = Router();

router.get('/dashboard', ensureAuthenticated, dashboard);
router.get('/folders/:id', ensureAuthenticated, showFolder);
router.post('/folders', ensureAuthenticated, createFolder);
router.post('/folders/:id/rename', ensureAuthenticated, renameFolder);
router.post('/folders/:id/delete', ensureAuthenticated, deleteFolder);

export default router;
