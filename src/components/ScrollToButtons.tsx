import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp, ArrowDown } from 'lucide-react';

const ScrollToButtons: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  // 排除登录页
  const isLoginPage = location.pathname === '/admin';
  // 文章管理、文章预览、文章编辑页始终显示
  const alwaysVisible =
    location.pathname.startsWith('/post/') ||
    location.pathname === '/admin/dashboard' ||
    location.pathname === '/admin/edit';

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

  if (isLoginPage) return null;

  const show = alwaysVisible || visible;

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 right-6 z-50 flex flex-col gap-2 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <button
        onClick={scrollToTop}
        title="回到顶部"
        className="w-10 h-10 rounded-full bg-slate-800/70 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
        aria-label="回到顶部"
      >
        <ArrowUp size={18} />
      </button>
      <button
        onClick={scrollToBottom}
        title="回到底部"
        className="w-10 h-10 rounded-full bg-slate-800/70 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
        aria-label="回到底部"
      >
        <ArrowDown size={18} />
      </button>
    </div>
  );
};

export default ScrollToButtons;
