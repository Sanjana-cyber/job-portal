const cloudinary = require("../config/cloudinary");

/**
 * Upload a file buffer to Cloudinary via upload stream
 * @param {Buffer} buffer        - File buffer from multer memoryStorage
 * @param {string} folder        - Cloudinary folder path
 * @param {string} resourceType  - "image" | "raw"
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadToCloudinary = (buffer, folder, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType,
    };

    // Auto-crop profile photos to a square face-focused thumbnail
    if (resourceType === "image") {
      options.transformation = [
        { width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" },
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
      });
    });

    uploadStream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by its public_id
 * Silently fails if publicId is empty — safe to call unconditionally
 * @param {string} publicId      - Cloudinary public_id stored in MongoDB
 * @param {string} resourceType  - "image" | "raw"
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    // Log but don't crash — old file cleanup is non-critical
    console.error(`⚠️  Cloudinary delete failed for ${publicId}:`, err.message);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
