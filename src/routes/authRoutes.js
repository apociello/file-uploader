import { Router } from 'express';
import {
  loginGet,
  loginPost,
  registerGet,
  registerPost,
  logout,
  dashBoard,
} from '../controllers/authController.js';
import { ensureAuthenticated, ensureGuest } from '../middlewares/middleware.js';

const router = Router();

router.get('/login', ensureGuest, loginGet);
router.post('/login', ensureGuest, loginPost);

router.get('/register', ensureGuest, registerGet);
router.post('/register', ensureGuest, registerPost);

router.post('/logout', ensureAuthenticated, logout);

router.get('/dashboard', ensureAuthenticated, dashBoard);

export default router;
