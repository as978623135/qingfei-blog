import { Router } from 'express';
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getPostsByCategory,
  searchPosts,
  getAllCategories,
  getAllTags,
  getArchives,
  batchDeleteCategories,
  renameCategory,
  setCategoryOrder,
  getCustomCategories,
  setCustomCategories,
  Post
} from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 获取所有文章
router.get('/', (req, res) => {
  try {
    const posts = getAllPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: '获取文章失败' });
  }
});

// 查询视频信息（B站/抖音，需要认证，用于编辑器插入视频卡片）
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function findItemList(obj: any): any {
  if (!obj || typeof obj !== 'object') return null;
  if (Array.isArray(obj.item_list) && obj.item_list[0]) return obj.item_list[0];
  for (const v of Object.values(obj)) {
    const found = findItemList(v);
    if (found) return found;
  }
  return null;
}

router.get('/video-info', authMiddleware, async (req: AuthRequest, res) => {
  const url = String(req.query.url || '');

  // 抖音链接
  if (/douyin\.com/.test(url)) {
    try {
      const linkMatch = url.match(/https?:\/\/[^\s]*douyin\.com\/[^\s]*/);
      if (!linkMatch) {
        res.status(400).json({ error: '未识别到有效的抖音视频链接' });
        return;
      }
      // 跟随 302 重定向解析短链，提取视频 ID
      const linkResp = await fetch(linkMatch[0], { redirect: 'follow', headers: { 'User-Agent': UA_PC } });
      const videoId = linkResp.url.match(/\/(?:share\/)?video\/(\d+)/)?.[1];
      if (!videoId) {
        res.status(400).json({ error: '未识别到有效的抖音视频链接' });
        return;
      }
      // 抓取分享页解析视频信息
      const pageResp = await fetch(`https://www.iesdouyin.com/share/video/${videoId}/`, {
        headers: { 'User-Agent': UA_MOBILE }
      });
      const html = await pageResp.text();
      const dataMatch = html.match(/window\._ROUTER_DATA\s*=\s*(\{[\s\S]*?\})<\/script>/);
      if (!dataMatch) {
        res.status(502).json({ error: '解析视频信息失败，请手动填写' });
        return;
      }
      const item = findItemList(JSON.parse(dataMatch[1]));
      const rawDesc = item?.desc || '';
      // 清理标题中的话题标签和@提及
      const title = rawDesc.replace(/#[^\s#]+/g, '').replace(/@[^\s@]+/g, '').replace(/\s+/g, ' ').trim();
      const coverUrl = item?.video?.cover?.url_list?.[0];
      if (!title || !coverUrl) {
        res.status(502).json({ error: '解析视频信息失败，请手动填写' });
        return;
      }
      // 封面签名 URL 约 10 天过期，下载转存到本地
      const coverResp = await fetch(coverUrl, { headers: { 'User-Agent': UA_MOBILE } });
      if (!coverResp.ok) {
        res.status(502).json({ error: '封面下载失败，请手动填写' });
        return;
      }
      const filename = `dy-cover-${videoId}.webp`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(await coverResp.arrayBuffer()));
      res.json({
        platform: 'douyin',
        title,
        author: item?.author?.nickname || '',
        cover: `/uploads/${filename}`,
        url: `https://www.douyin.com/video/${videoId}`
      });
    } catch (err) {
      res.status(500).json({ error: '获取视频信息失败，请手动填写' });
    }
    return;
  }

  // B站链接
  const match = url.match(/BV[0-9A-Za-z]{10}/);
  if (!match) {
    res.status(400).json({ error: '未识别到有效的视频链接（支持B站/抖音）' });
    return;
  }
  const bvid = match[0];
  try {
    const resp = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
      headers: {
        'User-Agent': UA_PC,
        'Referer': 'https://www.bilibili.com'
      }
    });
    const data = await resp.json() as any;
    if (data.code !== 0 || !data.data) {
      res.status(404).json({ error: '视频不存在或无法获取信息' });
      return;
    }
    res.json({
      platform: 'bilibili',
      title: data.data.title,
      author: data.data.owner?.name || '',
      cover: String(data.data.pic).replace(/^http:\/\//, 'https://'),
      url: `https://www.bilibili.com/video/${bvid}`
    });
  } catch (err) {
    res.status(500).json({ error: '获取视频信息失败，请手动填写' });
  }
});

// 获取单个文章
router.get('/:id', (req, res) => {
  try {
    const post = getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ error: '文章不存在' });
      return;
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: '获取文章失败' });
  }
});

// 创建文章（需要认证）
router.post('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { title, content, summary, category, tags } = req.body;
    const now = new Date().toISOString();
    const finalSummary = summary || content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
    const newPost: Post = {
      id: Date.now().toString(),
      title,
      content,
      summary: finalSummary,
      category: category || '未分类',
      tags: tags || [],
      created_at: now,
      updated_at: now
    };
    createPost(newPost);
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: '创建文章失败' });
  }
});

// 更新文章（需要认证）
router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { title, content, summary, category, tags } = req.body;
    const post = getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ error: '文章不存在' });
      return;
    }
    const finalSummary = summary || content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
    updatePost(req.params.id, {
      title,
      content,
      summary: finalSummary,
      category,
      tags,
      updated_at: new Date().toISOString()
    });
    const updated = getPostById(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新文章失败' });
  }
});

// 删除文章（需要认证）
router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const post = getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ error: '文章不存在' });
      return;
    }
    deletePost(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: '删除文章失败' });
  }
});

// 按分类获取文章
router.get('/category/:category', (req, res) => {
  try {
    const posts = getPostsByCategory(req.params.category);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: '获取文章失败' });
  }
});

// 搜索文章
router.get('/search/:keyword', (req, res) => {
  try {
    const posts = searchPosts(req.params.keyword);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: '搜索文章失败' });
  }
});

// 获取分类列表
router.get('/meta/categories', (req, res) => {
  try {
    const categories = getAllCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: '获取分类失败' });
  }
});

// 获取标签列表
router.get('/meta/tags', (req, res) => {
  try {
    const tags = getAllTags();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: '获取标签失败' });
  }
});

// 获取归档
router.get('/meta/archives', (req, res) => {
  try {
    const archives = getArchives();
    res.json(archives);
  } catch (err) {
    res.status(500).json({ error: '获取归档失败' });
  }
});

// 批量删除分类
router.post('/categories/batch-delete', authMiddleware, (req: AuthRequest, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: '请选择要删除的分类' });
  }
  batchDeleteCategories(categories);
  res.json({ success: true });
});

// 保存分类排序
router.post('/categories/reorder', authMiddleware, (req: AuthRequest, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: '排序数据格式错误' });
  }
  setCategoryOrder(order);
  res.json({ success: true });
});

// 批量新增自定义分类
router.post('/categories/add', authMiddleware, (req: AuthRequest, res) => {
  const { categories } = req.body;
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: '无效的分类列表' });
  }

  const custom = getCustomCategories();
  const added: string[] = [];
  const existing: string[] = [];

  for (const name of categories) {
    if (typeof name === 'string' && name.trim()) {
      const trimmed = name.trim();
      if (!custom.includes(trimmed)) {
        custom.push(trimmed);
        added.push(trimmed);
      } else {
        existing.push(trimmed);
      }
    }
  }

  if (added.length > 0) {
    setCustomCategories(custom);
  }

  res.json({ success: true, added, existing });
});

// 重命名分类
router.post('/categories/rename', authMiddleware, (req: AuthRequest, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') {
    return res.status(400).json({ error: '参数错误' });
  }
  if (oldName === newName) {
    return res.json({ success: true });
  }
  renameCategory(oldName, newName);
  res.json({ success: true });
});

export default router;
