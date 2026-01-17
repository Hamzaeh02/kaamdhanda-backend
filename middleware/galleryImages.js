const multer = require('multer');
const path = require('path');

// Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/gallery/'); // separate folder for gallery images
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only images are allowed for gallery'));
};

// Max file size 5MB per image
const limits = { fileSize: 5 * 1024 * 1024 };

const uploadGallery = multer({ storage, fileFilter, limits }).array('galleryImages', 10); 
// 'galleryImages' = field name from front-end
// max 10 images per upload

module.exports = uploadGallery;
