import { Router } from 'express';
import { dashboard, createFolder } from '../controllers/folderController.js';
import { ensureAuthenticated } from '../middlewares/middleware.js';

const router = Router();

router.get('/dashboard', ensureAuthenticated, dashboard);
router.post('/folders', ensureAuthenticated, createFolder);

export default router;
