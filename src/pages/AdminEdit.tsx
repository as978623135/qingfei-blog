import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, X, Feather, Upload, Plus, Tag, ArrowUp, ArrowDown } from 'lucide-react';
import { api, Post } from '../services/api';
import MarkdownEditor from '../components/MarkdownEditor';
import AdminLoginModal from '../components/AdminLoginModal';

const AdminEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: ''
  });
  const [loading, setLoading] = useState(isEdit);
  const [categories, setCategories] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const pendingSave = useRef(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    loadCategories();
    if (isEdit && id) {
      loadPost(id);
    }
  }, [id, isEdit]);

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats.filter(c => c !== '全部分类' && c !== '全部'));
    } catch {
      setCategories([]);
    }
  };

  const loadPost = async (postId: string) => {
    try {
      const post = await api.getPost(postId);
      setFormData({
        title: post.title,
        summary: post.summary || '',
        content: post.content,
        category: post.category || ''
      });
    } catch (err) {
      alert('加载文章失败');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split('\n');
      let title = '';
      let body = content;

      // 如果第一行是 Markdown 一级标题，提取为文章标题
      if (lines[0]?.startsWith('# ')) {
        title = lines[0].replace('# ', '').trim();
        body = lines.slice(1).join('\n').trim();
      } else {
        // 否则使用文件名（去掉 .md 后缀）作为标题
        title = file.name.replace(/\.md$/i, '');
      }

      setFormData(prev => ({
        ...prev,
        title,
        content: body
      }));
    };
    reader.readAsText(file);

    // 清空 input 值，允许重复选择同一文件
    e.target.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (isEdit && id) {
        await api.updatePost(id, formData);
        alert('文章更新成功');
        pendingSave.current = false;
        navigate(`/post/${id}`);
      } else {
        const post = await api.createPost(formData);
        alert('文章发布成功');
        pendingSave.current = false;
        navigate(`/post/${post.id}`);
      }
    } catch (err: any) {
      const msg = err.message || '操作失败';
      if (msg.includes('token') || msg.includes('未授权') || msg.includes('401')) {
        pendingSave.current = true;
        setShowLoginModal(true);
      } else {
        alert(msg);
      }
    }
  };

  if (loading) {
    return <div className="container py-20 text-center text-slate-400">加载中...</div>;
  }

  return (
    <div className="container py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 max-w-screen-2xl mx-auto"
      >
        <div className="flex items-center mb-8 pb-4 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <Feather className="w-6 h-6 text-sky-500" />
            <h1 className="text-2xl font-semibold text-slate-800">
              {isEdit ? '编辑文章' : '新建文章'}
            </h1>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              文章标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-400 focus:outline-none transition-colors"
              placeholder="请输入文章标题"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              文章摘要
            </label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-400 focus:outline-none transition-colors"
              placeholder="留空将自动提取正文前150字"
            />
            <p className="text-xs text-slate-400 mt-1">
              如不填写，系统将自动提取正文前150字作为摘要
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              文章分类 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-400 focus:outline-none transition-colors bg-white"
                required
              >
                <option value="">请选择分类</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="flex items-center gap-1 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl font-medium border border-slate-200 hover:border-sky-300 hover:text-sky-500 transition-all whitespace-nowrap"
              >
                <Plus size={16} /> 新建
              </button>
            </div>
          </div>

          {showNewCategory && (
            <div className="flex gap-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-400 focus:outline-none transition-colors"
                placeholder="输入新分类名称"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (newCategory.trim()) {
                    setFormData({ ...formData, category: newCategory.trim() });
                    if (!categories.includes(newCategory.trim())) {
                      setCategories([...categories, newCategory.trim()]);
                    }
                    setNewCategory('');
                    setShowNewCategory(false);
                  }
                }}
                className="px-5 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
              >
                确认
              </button>
              <button
                type="button"
                onClick={() => { setShowNewCategory(false); setNewCategory(''); }}
                className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              文章内容 <span className="text-red-500">*</span>
            </label>
            <MarkdownEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="请输入文章内容，支持 Markdown 语法..."
            />
            <p className="text-xs text-slate-400 mt-1">
              支持 Markdown 全语法：标题、加粗、斜体、列表、引用、代码块、表格、链接等
            </p>
          </div>

        </form>
      </motion.div>

      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          pendingSave.current = false;
        }}
        onSuccess={() => {
          if (pendingSave.current) {
            handleSubmit();
          }
        }}
      />

      {/* 右侧边栏按钮组 */}
      <div className="fixed top-1/2 -translate-y-1/2 right-6 z-50 flex flex-col gap-3">
        {!isEdit && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="导入 Markdown"
            aria-label="导入 Markdown"
            className="w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shadow-xl transition-colors"
          >
            <Upload size={20} />
          </button>
        )}
        <button
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          title={isEdit ? '保存修改' : '发布文章'}
          aria-label={isEdit ? '保存修改' : '发布文章'}
          className="w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-xl transition-colors"
        >
          <Save size={20} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          title="取消"
          aria-label="取消"
          className="w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shadow-xl transition-colors"
        >
          <X size={20} />
        </button>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="回到顶部"
          aria-label="回到顶部"
          className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white ring-2 ring-white/60 flex items-center justify-center shadow-xl transition-colors"
        >
          <ArrowUp size={20} />
        </button>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          title="回到底部"
          aria-label="回到底部"
          className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white ring-2 ring-white/60 flex items-center justify-center shadow-xl transition-colors"
        >
          <ArrowDown size={20} />
        </button>
      </div>
    </div>
  );
};

export default AdminEdit;
