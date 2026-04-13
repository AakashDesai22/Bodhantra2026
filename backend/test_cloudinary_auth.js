require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

cloudinary.api.resources({ max_results: 1 })
  .then(res => console.log("List resources SUCCESS:", res.resources.length))
  .catch(err => console.error("List resources ERROR:", err));
