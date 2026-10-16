import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { UPLOADS_DIR } from '../config/multer.js';

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

// Returns the ids of the folder and all its subfolders, going down one level at a time
const getDescendantIds = async (folderId, ownerId) => {
  const ids = [folderId];
  let level = [folderId];

  while (level.length > 0) {
    const children = await prisma.folder.findMany({
      where: { parentId: { in: level }, ownerId },
      select: { id: true },
    });
    level = children.map((child) => child.id);
    ids.push(...level);
  }

  return ids;
};

// Returns the folder only if the id is valid and it belongs to the user, otherwise null.
// Filtering by ownerId too: someone else's folder is treated as not found.
// `query` is passed to Prisma as is (select, include...)
export const findOwnedFolder = async (idParam, ownerId, query = {}) => {
  const id = Number(idParam);
  if (!Number.isInteger(id)) return null;

  return prisma.folder.findFirst({
    ...query,
    where: { id, ownerId },
  });
};

export const dashboard = async (req, res, next) => {
  try {
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({
        where: { ownerId: req.user.id, parentId: null },
        orderBy: { id: 'asc' },
      }),
      prisma.file.findMany({
        where: { ownerId: req.user.id, folderId: null },
        orderBy: { name: 'asc' },
      }),
    ]);
    res.render('dashboard', { folders, files, currentFolder: null, ancestors: [] });
  } catch (err) {
    next(err);
  }
};

export const showFolder = async (req, res, next) => {
  try {
    const folder = await findOwnedFolder(req.params.id, req.user.id, {
      include: {
        children: { orderBy: { name: 'asc' } },
        files: { orderBy: { name: 'asc' } },
      },
    });
    if (!folder) return res.status(404).render('error', { message: 'Folder not found' });

    const ancestors = await getAncestors(folder, req.user.id);

    res.render('dashboard', {
      folders: folder.children,
      files: folder.files,
      currentFolder: folder,
      ancestors,
    });
  } catch (err) {
    next(err);
  }
};

export const renameFolder = async (req, res, next) => {
  try {
    const folder = await findOwnedFolder(req.params.id, req.user.id, {
      select: { id: true, parentId: true },
    });
    if (!folder) return res.status(404).render('error', { message: 'Folder not found' });

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

export const deleteFolder = async (req, res, next) => {
  try {
    const folder = await findOwnedFolder(req.params.id, req.user.id, {
      select: { id: true, parentId: true },
    });
    if (!folder) return res.status(404).render('error', { message: 'Folder not found' });

    // Save where the files live on disk before their rows are gone
    const folderIds = await getDescendantIds(folder.id, req.user.id);
    const files = await prisma.file.findMany({
      where: { folderId: { in: folderIds } },
      select: { storageKey: true },
    });

    // Subfolders and files are removed by the database (onDelete: Cascade in the schema)
    await prisma.folder.delete({ where: { id: folder.id } });

    // The database only removes rows, so clean up uploads/ ourselves
    await Promise.all(
      files.map((file) => fs.unlink(path.join(UPLOADS_DIR, file.storageKey)).catch(() => {})),
    );

    res.redirect(folder.parentId ? `/folders/${folder.parentId}` : '/dashboard');
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
      if (!parent) return res.status(404).render('error', { message: 'Folder not found' });
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