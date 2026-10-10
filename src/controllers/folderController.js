import { prisma } from '../lib/prisma.js';

export const dashboard = async (req, res, next) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { ownerId: req.user.id, parentId: null },
      orderBy: { name: 'asc' },
    });
    res.render('dashboard', { folders, currentFolder: null });
  } catch (err) {
    next(err);
  }
};

export const showFolder = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).send('Folder not found');

    // Filtering by ownerId too: someone else's folder is treated as not found
    const folder = await prisma.folder.findFirst({
      where: { id, ownerId: req.user.id },
      include: { children: { orderBy: { name: 'asc' } } },
    });
    if (!folder) return res.status(404).send('Folder not found');

    res.render('dashboard', { folders: folder.children, currentFolder: folder });
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