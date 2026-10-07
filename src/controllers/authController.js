import bcrypt from 'bcryptjs';
import passport from '../config/passport.js';
import { prisma } from '../lib/prisma.js';

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
};

export const login = passport.authenticate('local');

export const loginSuccess = (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
};

export const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: 'Logged out' });
  });
};
