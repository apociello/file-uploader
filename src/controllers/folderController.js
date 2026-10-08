import { prisma } from '../lib/prisma.js';

export const dashboard = async (req, res, next) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { ownerId: req.user.id, parentId: null },
      orderBy: { name: 'asc' },
    });
    res.render('dashboard', { folders });
  } catch (err) {
    next(err);
  }
};

export const createFolder = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.redirect('/dashboard');

    await prisma.folder.create({
      data: { name, ownerId: req.user.id },
    });
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};