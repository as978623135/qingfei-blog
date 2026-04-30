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

export default router;
