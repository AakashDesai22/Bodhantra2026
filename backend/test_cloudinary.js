require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Cloudinary Configured?", cloudinary.config());

cloudinary.api.ping((err, res) => {
    if (err) {
        console.error("Cloudinary Ping Error:", err);
    } else {
        console.log("Cloudinary Ping Success:", res);
    }
});
