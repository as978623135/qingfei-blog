import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';
import { api, Post } from '../services/api';

const AdminDashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await api.getPosts();
      setPosts(data);
    } catch (err) {
      console.error('加载文章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这篇文章吗？')) return;
    try {
      await api.deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      alert('删除失败');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="container py-8">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3 mb-4">
          <span className="text-sky-500">⚙️</span> 文章管理
        </h1>

      {loading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-sky-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-amber-400 to-orange-400">
                <th className="text-left px-6 py-4 text-sm font-semibold text-white uppercase tracking-wide">标题</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white uppercase tracking-wide">分类</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white uppercase tracking-wide">发布时间</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white uppercase tracking-wide">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <motion.tr
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <Link
                      to={`/post/${post.id}`}
                      className="hover:text-sky-500 transition-colors"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-sky-50 text-sky-600">
                      {post.category || '未分类'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(post.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/edit/${post.id}`}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-sky-50 text-sky-500 hover:bg-sky-500 hover:text-white transition-all"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;