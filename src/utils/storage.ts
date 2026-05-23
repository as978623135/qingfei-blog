// 安全的 localStorage 包装，在 iframe/隐私模式下不报错
const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      // SecurityError: 跨域 iframe 中禁止访问 storage
      // QuotaExceededError: storage 已满
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // SecurityError / QuotaExceededError — 静默失败，不阻断渲染链
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // 静默失败
    }
  },
};

export default safeStorage;
