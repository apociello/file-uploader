import { Router } from 'express';
import { dashboard, showFolder, createFolder, renameFolder } from '../controllers/folderController.js';
import { ensureAuthenticated } from '../middlewares/middleware.js';

const router = Router();

router.get('/dashboard', ensureAuthenticated, dashboard);
router.get('/folders/:id', ensureAuthenticated, showFolder);
router.post('/folders', ensureAuthenticated, createFolder);
router.post('/folders/:id/rename', ensureAuthenticated, renameFolder);

export default router;
