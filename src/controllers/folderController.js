import { prisma } from '../lib/prisma.js';

// Walks up the parent chain, returning ancestors from the root down
const getAncestors = async (folder, ownerId) => {
  const ancestors = [];
  let parentId = folder.parentId;

  while (parentId) {
    const parent = await prisma.folder.findFirst({
      where: { id: parentId, ownerId },
      select: { id: true, name: true, parentId: true },
    });
    if (!parent) break;

    ancestors.unshift(parent);
    parentId = parent.parentId;
  }

  return ancestors;
};

export const dashboard = async (req, res, next) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { ownerId: req.user.id, parentId: null },
      orderBy: { name: 'asc' },
    });
    res.render('dashboard', { folders, currentFolder: null, ancestors: [] });
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

    const ancestors = await getAncestors(folder, req.user.id);

    res.render('dashboard', { folders: folder.children, currentFolder: folder, ancestors });
  } catch (err) {
    next(err);
  }
};

export const renameFolder = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).send('Folder not found');

    const folder = await prisma.folder.findFirst({
      where: { id, ownerId: req.user.id },
      select: { id: true, parentId: true },
    });
    if (!folder) return res.status(404).send('Folder not found');

    // The renamed card lives in the parent's view, so go back there
    const redirectTo = folder.parentId ? `/folders/${folder.parentId}` : '/dashboard';

    const name = req.body.name?.trim();
    if (!name) return res.redirect(redirectTo);

    await prisma.folder.update({
      where: { id },
      data: { name },
    });
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
};

export const createFolder = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const parentId = req.body.parentId ? Number(req.body.parentId) : null;

    // The hidden input can be edited in the browser: verify the parent is ours
    if (parentId !== null) {
      if (!Number.isInteger(parentId)) return res.status(404).send('Folder not found');

      const parent = await prisma.folder.findFirst({
        where: { id: parentId, ownerId: req.user.id },
        select: { id: true },
      });
      if (!parent) return res.status(404).send('Folder not found');
    }

    const redirectTo = parentId ? `/folders/${parentId}` : '/dashboard';
    if (!name) return res.redirect(redirectTo);

    await prisma.folder.create({
      data: { name, ownerId: req.user.id, parentId },
    });
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
};