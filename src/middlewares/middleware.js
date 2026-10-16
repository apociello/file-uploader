import { prisma } from '../lib/prisma.js';
import { SYSTEM_FOLDERS } from '../lib/systemFolders.js';

export const ensureAuthenticated =(req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// The sidebar is on every page, so its folders are loaded for every request
export const loadSystemFolders = async (req, res, next) => {
  if (!req.user) return next();

  try {
    const folders = await prisma.folder.findMany({
      where: { ownerId: req.user.id, isSystem: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });

    res.locals.systemFolders = folders.map((folder) => ({
      ...folder,
      icon: SYSTEM_FOLDERS.find(({ name }) => name === folder.name)?.icon,
    }));

    next();
  } catch (err) {
    next(err);
  }
};

export const ensureGuest =(req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  next();
};
