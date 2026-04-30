import React from 'react';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 border-t border-blue-100 py-6 z-50"
    >
      <div className="container text-center">
        <div className="flex flex-col gap-2">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 text-sm hover:text-sky-500 transition-colors"
          >
            <i className="fas fa-shield-alt mr-2"></i>
            豫ICP备2026013735号-1
          </a>
          <span className="text-slate-300 text-xs">© 2026 青飞的小站</span>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;