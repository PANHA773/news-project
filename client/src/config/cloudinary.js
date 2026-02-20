const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

export const cloudinaryConfig = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
};

export const isCloudinaryClientConfigured = () =>
  Boolean(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);

export const cloudinaryUploadUrl = cloudinaryConfig.cloudName
  ? `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`
  : "";
