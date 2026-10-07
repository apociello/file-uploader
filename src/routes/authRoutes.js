import { Router } from 'express';
import {
  register,
  login,
  loginSuccess,
  logout,
} from '../controllers/authController.js';
import { ensureAuthenticated, ensureGuest } from '../middlewares/middleware.js';

const router = Router();

router.post('/register', ensureGuest, register);
router.post('/login', ensureGuest, login, loginSuccess);
router.post('/logout', ensureAuthenticated, logout);

export default router;
