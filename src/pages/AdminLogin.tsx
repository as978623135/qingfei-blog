import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(password);
      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setError('密码错误');
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 rounded-2xl p-10 shadow-xl border border-sky-100">
          <div className="text-center mb-8">
            <Shield className="w-14 h-14 text-sky-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-800">管理后台登录</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                管理密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理密码"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-400 text-white rounded-xl font-medium hover:shadow-lg transition-shadow disabled:opacity-60"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 flex items-center justify-center gap-2 text-slate-500 hover:text-sky-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;