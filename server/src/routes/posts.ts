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

const router = Router();

// 获取所有文章
router.get('/', (req, res) => {
  try {
    const posts = getAllPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: '获取文章失败' });
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
