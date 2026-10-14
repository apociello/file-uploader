import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { UPLOADS_DIR } from '../config/multer.js';
import { findOwnedFolder } from './folderController.js';

// Same idea as findOwnedFolder: someone else's file is treated as not found
const findOwnedFile = async (idParam, ownerId, query = {}) => {
  const id = Number(idParam);
  if (!Number.isInteger(id)) return null;

  return prisma.file.findFirst({
    ...query,
    where: { id, ownerId },
  });
};

export const deleteFile = async (req, res, next) => {
  try {
    const file = await findOwnedFile(req.params.id, req.user.id, {
      select: { id: true, folderId: true, storageKey: true },
    });
    if (!file) return res.status(404).render('error', { message: 'File not found' });

    // Database first: if removing it from disk fails, the user never sees a
    // broken file, there's just an orphan left in uploads/
    await prisma.file.delete({ where: { id: file.id } });
    await fs.unlink(path.join(UPLOADS_DIR, file.storageKey)).catch(() => {});

    res.redirect(file.folderId ? `/folders/${file.folderId}` : '/dashboard');
  } catch (err) {
    next(err);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const file = await findOwnedFile(req.params.id, req.user.id);
    if (!file) return res.status(404).render('error', { message: 'File not found' });

    // storageKey comes from our database, never from the request,
    // so it can't point outside uploads/. The second argument is the
    // name the browser saves it with.
    res.download(path.join(UPLOADS_DIR, file.storageKey), file.name);
  } catch (err) {
    next(err);
  }
};

export const uploadFile = async (req, res, next) => {
  // Multer has already saved the file to disk before we get here
  const file = req.file;

  try {
    let folderId = null;

    // The hidden input can be edited in the browser: verify the folder is ours
    if (req.body.folderId) {
      const folder = await findOwnedFolder(req.body.folderId, req.user.id, {
        select: { id: true },
      });
      if (!folder) {
        if (file) await fs.unlink(file.path);
        return res.status(404).render('error', { message: 'Folder not found' });
      }
      folderId = folder.id;
    }

    const redirectTo = folderId ? `/folders/${folderId}` : '/dashboard';
    if (!file) return res.redirect(redirectTo);

    await prisma.file.create({
      data: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey: file.filename,
        ownerId: req.user.id,
        folderId,
      },
    });
    res.redirect(redirectTo);
  } catch (err) {
    // Don't leave a file on disk that no database row points to
    if (file) await fs.unlink(file.path).catch(() => {});
    next(err);
  }
};
