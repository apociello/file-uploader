import fs from 'fs/promises';
import { prisma } from '../lib/prisma.js';
import { findOwnedFolder } from './folderController.js';

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
        return res.status(404).send('Folder not found');
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
