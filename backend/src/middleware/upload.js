const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    const name = `task-${req.params.id}-${unique}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|txt|png|jpg|jpeg|gif|webp)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: pdf, doc, docx, txt, images.'), false);
  },
});

exports.uploadSingle = upload.single('file');
