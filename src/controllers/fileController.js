import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { prisma } from '../lib/prisma.js';
import { uploadToStorage, deleteFromStorage, signedDownloadUrl } from '../config/cloudinary.js';
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

    // Database first: if removing it from Cloudinary fails, the user never
    // sees a broken file, there's just an orphan left in storage
    await prisma.file.delete({ where: { id: file.id } });
    await deleteFromStorage(file.storageKey).catch(() => {});

    res.redirect(file.folderId ? `/folders/${file.folderId}` : '/dashboard');
  } catch (err) {
    next(err);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const file = await findOwnedFile(req.params.id, req.user.id);
    if (!file) return res.status(404).render('error', { message: 'File not found' });

    const response = await fetch(signedDownloadUrl(file.storageKey));
    if (!response.ok) throw new Error(`Cloudinary download failed with ${response.status}`);

    // Sent with its original name, piped through in chunks as it arrives
    res.attachment(file.name);
    res.type(file.mimeType);
    await pipeline(Readable.fromWeb(response.body), res);
  } catch (err) {
    next(err);
  }
};

export const uploadFile = async (req, res, next) => {
  try {
    let folderId = null;

    // The hidden input can be edited in the browser: verify the folder is ours
    if (req.body.folderId) {
      const folder = await findOwnedFolder(req.body.folderId, req.user.id, {
        select: { id: true },
      });
      if (!folder) return res.status(404).render('error', { message: 'Folder not found' });
      folderId = folder.id;
    }

    const redirectTo = folderId ? `/folders/${folderId}` : '/dashboard';
    if (!req.file) return res.redirect(redirectTo);

    const storageKey = await uploadToStorage(req.file);

    try {
      await prisma.file.create({
        data: {
          name: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          storageKey,
          ownerId: req.user.id,
          folderId,
        },
      });
    } catch (err) {
      // Don't leave a file in Cloudinary that no database row points to
      await deleteFromStorage(storageKey).catch(() => {});
      throw err;
    }

    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
};
