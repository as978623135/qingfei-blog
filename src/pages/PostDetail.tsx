import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Edit, Share2, ThumbsUp, PenLine } from 'lucide-react';
import { api, Post } from '../services/api';
import safeStorage from '../utils/storage';
import MarkdownRenderer from '../components/MarkdownRenderer';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [liked, setLiked] = useState(false);

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
    <div className="container py-12">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex justify-between items-center">
          {isLoggedIn && (
            <button
              onClick={() => navigate(`/admin/edit?id=${id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-200 bg-white text-sky-600 hover:bg-sky-50 transition-colors text-sm"
            >
              <PenLine size={16} />
              编辑文章
            </button>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-200 bg-white text-sky-600 hover:bg-sky-50 transition-colors text-sm ml-auto"
          >
            <ArrowLeft size={16} />
            返回首页
          </Link>
        </div>

        <header className="text-center pb-10 mb-10 border-b border-sky-100">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-5">
            {post.title}
          </h1>
          <div className="flex justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-sky-500" />
              发布于 {formatDate(post.created_at)}
            </span>
            {post.updated_at !== post.created_at && (
              <span className="flex items-center gap-2">
                <Edit size={16} className="text-sky-500" />
                更新于 {formatDate(post.updated_at)}
              </span>
            )}
          </div>
        </header>

        <div className="bg-white/90 rounded-2xl p-8 md:p-10 shadow-lg shadow-sky-100/50 border border-sky-100">
          <MarkdownRenderer content={post.content} />
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => {
              if (post) {
                const text = `【${post.title}】 https://qingfei.online/post/${post.id}`;
                navigator.clipboard.writeText(text).then(() => {
                  alert('已复制到剪贴板');
                });
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
          >
            <Share2 size={18} />
            分享
          </button>
          <button
            onClick={() => setLiked(!liked)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors ${
              liked
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
            }`}
          >
            <ThumbsUp size={18} />
            {liked ? '已点赞' : '点赞'}
          </button>
        </div>
      </motion.article>
    </div>
  );
};

export default PostDetail;