import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getAdminSetting, setAdminSetting } from '../db';
import { generateToken } from '../middleware/auth';

const router = Router();
const DEFAULT_PASSWORD = '52ywq1314..';

// 初始化管理员密码（如果不存在）
export function initAdminPassword(): void {
  const existing = getAdminSetting('password_hash');
  if (!existing) {
    const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
    setAdminSetting('password_hash', hash);
  }
}

// 登录
router.post('/login', (req, res) => {
  try {
    const { password } = req.body;
    const hash = getAdminSetting('password_hash');

    // 如果没有设置密码，用默认密码
    const validHash = hash || bcrypt.hashSync(DEFAULT_PASSWORD, 10);
    const valid = bcrypt.compareSync(password, validHash);

    if (!valid) {
      res.status(401).json({ error: '密码错误' });
      return;
    }

    const token = generateToken();
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: '登录失败' });
  }
});

// 修改密码
router.post('/change-password', (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const hash = getAdminSetting('password_hash');
    const validHash = hash || bcrypt.hashSync(DEFAULT_PASSWORD, 10);
    const valid = bcrypt.compareSync(oldPassword, validHash);

    if (!valid) {
      res.status(401).json({ error: '原密码错误' });
      return;
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    setAdminSetting('password_hash', newHash);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '修改密码失败' });
  }
});

export default router;
