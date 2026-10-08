const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const storage = {
  _handleFile(req, file, callback) {
    const uploadStream = cloudinary.uploader.upload_stream({
      folder: 'wanderlust/listings',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      public_id: crypto.randomUUID(),
    }, (error, result) => {
      if (error) return callback(error);
      callback(null, {
        filename: result.public_id,
        path: result.secure_url,
        size: result.bytes,
      });
    });

    file.stream.pipe(uploadStream);
  },

  _removeFile(req, file, callback) {
    cloudinary.uploader.destroy(file.filename, { invalidate: true })
      .then(() => callback(null))
      .catch(callback);
  },
};

module.exports = {
    cloudinary,
    storage,
}
