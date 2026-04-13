const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const axios = require('axios');
const FormData = require('form-data');

// Custom Native Multer Storage Engine using direct REST API to bypass SDK 403 blocks
function RestCloudinaryStorage() {}

RestCloudinaryStorage.prototype._handleFile = async function _handleFile(req, file, cb) {
  try {
    const form = new FormData();
    form.append('file', file.stream, { filename: file.originalname || 'upload.jpg' });
    form.append('upload_preset', 'bodhantra');
    form.append('folder', 'bodhantra2026');

    const url = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    // We send a direct raw HTTP request to bypass SDK signature and WAF issues
    const res = await axios.post(url, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    
    cb(null, {
      path: res.data.secure_url,
      size: res.data.bytes,
      filename: res.data.public_id
    });
  } catch (error) {
    console.error(">>> REST UPLOAD ERROR:", error.response ? error.response.data : error.message);
    cb(error);
  }
};

RestCloudinaryStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  cb(null); // Unsigned REST cannot delete, which is fine for our setup
};

const storage = new RestCloudinaryStorage();

const checkFileType = (file, cb) => {
    const filetypes = /jpg|jpeg|png|pdf|webp|heic|heif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only standard images (JPG, PNG, WEBP) and PDFs are allowed!'));
    }
};

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

module.exports = upload;
