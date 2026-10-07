import bcrypt from 'bcryptjs';
import passport from '../config/passport.js';
import { prisma } from '../lib/prisma.js';

export const loginGet = (req, res) => {
  const messages = req.session.messages || [];
  req.session.messages = [];
  res.render('login', { messages });
};

export const loginPost = passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureMessage: true,
});

export const registerGet = (req, res) => {
  const messages = req.session.messages || [];
  req.session.messages = [];
  res.render('register', { messages });
};

export const registerPost = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      req.session.messages = ['Email already in use'];
      return res.redirect('/register');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email, passwordHash },
    });

    res.redirect('/login');
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/login');
  });
};

export const dashBoard = (req, res) => {
  res.render('dashboard');
};
