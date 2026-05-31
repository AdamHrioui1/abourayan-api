const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload a base64 data URL to Cloudinary.
 * Returns the secure URL string.
 */
const uploadAvatar = async (base64DataUrl, publicId) => {
    const result = await cloudinary.uploader.upload(base64DataUrl, {
        folder: 'workers-avatars',
        public_id: publicId,          // reuse same ID so old image is replaced
        overwrite: true,
        resource_type: 'image',
        transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
        ]
    })
    return result.secure_url
}

/**
 * Delete an image from Cloudinary by its public_id.
 */
const deleteAvatar = async (publicId) => {
    await cloudinary.uploader.destroy(publicId)
}

module.exports = { uploadAvatar, deleteAvatar }
