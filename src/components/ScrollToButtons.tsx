import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUp, ArrowDown, Plus, Home } from 'lucide-react';

const ScrollToButtons: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  // 排除登录页
  const isLoginPage = location.pathname === '/admin';
  // 文章编辑页自建按钮组（含置顶置底），此组件不渲染
  const isEditPage = location.pathname.startsWith('/admin/edit');
  // 文章管理、文章预览页始终显示
  const alwaysVisible =
    location.pathname.startsWith('/post/') ||
    location.pathname === '/admin/dashboard';
  const isDashboard = location.pathname === '/admin/dashboard';

  useEffect(() => {
    if (isLoginPage || alwaysVisible) return;

    const handleScroll = () => {
      setVisible(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isLoginPage, alwaysVisible]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  if (isLoginPage || isEditPage) return null;

  const show = alwaysVisible || visible;

  const btnBase = 'w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-colors';

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 right-6 z-50 flex flex-col gap-3 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {isDashboard && (
        <>
          <Link
            to="/admin/edit"
            title="新建文章"
            aria-label="新建文章"
            className={`${btnBase} bg-sky-500 hover:bg-sky-600 text-white`}
          >
            <Plus size={20} />
          </Link>
          <Link
            to="/"
            title="返回首页"
            aria-label="返回首页"
            className={`${btnBase} bg-white hover:bg-slate-50 text-slate-600 border border-slate-200`}
          >
            <Home size={20} />
          </Link>
        </>
      )}
      <button
        onClick={scrollToTop}
        title="回到顶部"
        aria-label="回到顶部"
        className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white ring-2 ring-white/60`}
      >
        <ArrowUp size={20} />
      </button>
      <button
        onClick={scrollToBottom}
        title="回到底部"
        aria-label="回到底部"
        className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white ring-2 ring-white/60`}
      >
        <ArrowDown size={20} />
      </button>
    </div>
  );
};

export default ScrollToButtons;
