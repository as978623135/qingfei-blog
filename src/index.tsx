import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/index.css';

// ===== 诊断代码：确认 bundle.js 执行到了哪一步 =====
const diag = document.createElement('div');
diag.id = 'diag-bundle-start';
diag.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#22c55e;color:#fff;padding:4px 8px;font-size:12px;z-index:99999;text-align:center;';
diag.textContent = 'bundle.js 开始执行';
document.body.appendChild(diag);

window.onerror = function(msg, url, line, col, err) {
  diag.style.background = '#ef4444';
  diag.textContent = 'JS 错误: ' + String(msg).slice(0, 100);
  console.error('[DIAG]', msg, url, line, col, err);
};

window.onunhandledrejection = function(e) {
  diag.style.background = '#f97316';
  diag.textContent = 'Promise 拒绝: ' + String(e.reason).slice(0, 100);
  console.error('[DIAG] Promise rejected:', e.reason);
};
// ===== 诊断结束 =====

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 更新诊断标记
diag.style.background = '#3b82f6';
diag.textContent = 'ReactDOM.createRoot 成功';

root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

// 更新诊断标记
diag.style.background = '#8b5cf6';
diag.textContent = 'root.render() 已调用';
