import { v2 as cloudinary } from 'cloudinary';

// Parse CLOUDINARY_URL: cloudinary://KEY:SECRET@CLOUD_NAME
const cloudinaryUrl = process.env.CLOUDINARY_URL || '';
const parts = cloudinaryUrl.replace('cloudinary://', '').split('@');
const [key, secret] = parts[0].split(':');
const cloudName = parts[1];

cloudinary.config({
    cloud_name: cloudName,
    api_key: key,
    api_secret: secret,
});

/** Upload gambar dari base64 ke Cloudinary, kembalikan URL publik. */
export const uploadImage = (base64Data: string, folder: string = 'kompasdesa'): Promise<string> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            base64Data,
            { folder: folder },
            (error, result) => {
                if (error) reject(error);
                else resolve(result?.secure_url || '');
            }
        );
    });
};

/** Hapus gambar dari Cloudinary berdasarkan public_id. */
export const deleteImage = (publicId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
};

export default cloudinary;
