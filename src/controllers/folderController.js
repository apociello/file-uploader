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

// Returns the folder only if the id is valid and it belongs to the user, otherwise null.
// Filtering by ownerId too: someone else's folder is treated as not found.
// `query` is passed to Prisma as is (select, include...)
const findOwnedFolder = async (idParam, ownerId, query = {}) => {
  const id = Number(idParam);
  if (!Number.isInteger(id)) return null;

  return prisma.folder.findFirst({
    ...query,
    where: { id, ownerId },
  });
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
    const folder = await findOwnedFolder(req.params.id, req.user.id, {
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
    const folder = await findOwnedFolder(req.params.id, req.user.id, {
      select: { id: true, parentId: true },
    });
    if (!folder) return res.status(404).send('Folder not found');

    // The renamed card lives in the parent's view, so go back there
    const redirectTo = folder.parentId ? `/folders/${folder.parentId}` : '/dashboard';

    const name = req.body.name?.trim();
    if (!name) return res.redirect(redirectTo);

    await prisma.folder.update({
      where: { id: folder.id },
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
    let parentId = null;

    // The hidden input can be edited in the browser: verify the parent is ours
    if (req.body.parentId) {
      const parent = await findOwnedFolder(req.body.parentId, req.user.id, {
        select: { id: true },
      });
      if (!parent) return res.status(404).send('Folder not found');
      parentId = parent.id;
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