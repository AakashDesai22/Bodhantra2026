require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const validPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

cloudinary.uploader.upload(`data:image/png;base64,${validPngBase64}`).then(r => {
    console.log("SUCCESS NO FOLDER!", r.secure_url);
}).catch(e => {
    console.log("ERROR NO FOLDER:", e);
});
