import { v2 as cloudinary } from 'cloudinary';

// Credentials come from CLOUDINARY_URL in .env
cloudinary.config({ secure: true });

// raw: any file type, stored as is. authenticated: private, only reachable
// through a signed URL that our server creates
const OPTIONS = { resource_type: 'raw', type: 'authenticated' };

export const uploadToStorage = async (file) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, { ...OPTIONS, folder: 'file-uploader' });
  return result.public_id;
};

export const deleteFromStorage = (storageKey) => cloudinary.uploader.destroy(storageKey, OPTIONS);

// Valid for 60 seconds; only our server uses it, the browser never sees it
export const signedDownloadUrl = (storageKey) =>
  cloudinary.utils.private_download_url(storageKey, '', {
    ...OPTIONS,
    expires_at: Math.floor(Date.now() / 1000) + 60,
  });
