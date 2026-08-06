import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Calendar, Edit, Share2, ThumbsUp, PenLine, Download, Plus, Trash2, Home } from 'lucide-react';
import { api, Post } from '../services/api';
import safeStorage from '../utils/storage';
import MarkdownRenderer from '../components/MarkdownRenderer';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!safeStorage.getItem('admin_token'));
    if (id) {
      loadPost(id);
    }
  }, [id]);

  const loadPost = async (postId: string) => {
    try {
      const data = await api.getPost(postId);
      setPost(data);
    } catch (err) {
      console.error('加载文章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleExport = () => {
    if (!post) return;
    const blob = new Blob(
      [`# ${post.title}\n\n> 发布于 ${formatDate(post.created_at)}\n\n${post.content}`],
      { type: 'text/markdown' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="container py-20 text-center text-slate-400">加载中...</div>;
  }

  if (!post) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl text-slate-500 mb-4">文章不存在</h2>
        <Link to="/" className="text-sky-500 hover:underline">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-16 pb-12">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="text-center bg-white/90 rounded-2xl p-8 md:p-10 shadow-lg shadow-sky-100/50 border border-sky-100 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-5">
            {post.title}
          </h1>
          <div className="flex justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-sky-500" />
              发布于 {formatDate(post.created_at)}
            </span>
            <span className="flex items-center gap-2">
              <Edit size={16} className="text-sky-500" />
              更新于 {formatDate(post.updated_at)}
            </span>
          </div>
        </header>

        <div className="bg-white/90 rounded-2xl p-8 md:p-10 shadow-lg shadow-sky-100/50 border border-sky-100">
          <MarkdownRenderer content={post.content} />
        </div>

        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            onClick={() => {
              if (post) {
                const text = `【${post.title}】 https://qingfei.online/#/post/${post.id}`;
                navigator.clipboard.writeText(text).then(() => {
                  alert('已复制到剪贴板');
                });
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 transition-colors shadow-sm text-sm"
          >
            <Share2 size={16} />
            分享
          </button>
          <button
            onClick={() => setLiked(!liked)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors shadow-sm text-sm ${
              liked
                ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50'
            }`}
          >
            <ThumbsUp size={16} />
            {liked ? '已点赞' : '点赞'}
          </button>
        </div>
      </motion.article>

      {/* 右侧边栏按钮组 */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {isLoggedIn && (
          <>
            <button
              onClick={() => navigate('/admin/edit')}
              className="w-12 h-12 rounded-full bg-white text-slate-600 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-sky-600 transition-colors"
              title="新建文章"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => navigate(`/admin/edit/${id}`)}
              className="w-12 h-12 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-200 flex items-center justify-center hover:bg-sky-600 transition-colors"
              title="编辑文章"
            >
              <PenLine size={20} />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-12 h-12 rounded-full bg-white text-red-500 shadow-lg border border-red-100 flex items-center justify-center hover:bg-red-50 transition-colors"
              title="删除文章"
            >
              <Trash2 size={20} />
            </button>
          </>
        )}
        <button
          onClick={handleExport}
          className="w-12 h-12 rounded-full bg-white text-slate-600 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-sky-600 transition-colors"
          title="导出 Markdown"
        >
          <Download size={20} />
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-12 h-12 rounded-full bg-white text-slate-600 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-sky-600 transition-colors"
          title="返回首页"
        >
          <Home size={20} />
        </button>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-12 h-12 rounded-full bg-slate-800 text-white shadow-xl ring-2 ring-white/60 flex items-center justify-center hover:bg-slate-700 transition-colors"
          title="回到顶部"
        >
          <ArrowUp size={20} />
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
          className="w-12 h-12 rounded-full bg-slate-800 text-white shadow-xl ring-2 ring-white/60 flex items-center justify-center hover:bg-slate-700 transition-colors"
          title="回到底部"
        >
          <ArrowDown size={20} />
        </button>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (!id) return;
          try {
            await api.deletePost(id);
            setShowDeleteModal(false);
            navigate('/');
          } catch (err) {
            console.error('删除文章失败:', err);
            alert('删除文章失败');
          }
        }}
      />
    </div>
  );
};

export default PostDetail;