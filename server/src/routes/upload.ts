import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 确保上传目录存在
const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片或音频文件'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB（音频文件较大）
});

// 上传图片（需要认证）
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '没有上传文件' });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '上传失败' });
  }
});

// 上传音频（需要认证）
router.post('/audio', authMiddleware, upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '没有上传文件' });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '上传失败' });
  }
});

export default router;
