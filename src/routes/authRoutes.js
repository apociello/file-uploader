import { Router } from 'express';
import {
  loginGet,
  loginPost,
  registerGet,
  registerPost,
  logout,
} from '../controllers/authController.js';
import { ensureAuthenticated, ensureGuest } from '../middlewares/middleware.js';

const router = Router();

router.get('/', (req, res) => res.redirect('/dashboard'));

router.get('/login', ensureGuest, loginGet);
router.post('/login', ensureGuest, loginPost);

router.get('/register', ensureGuest, registerGet);
router.post('/register', ensureGuest, registerPost);

router.post('/logout', ensureAuthenticated, logout);

export default router;
