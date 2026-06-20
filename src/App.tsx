import React, { Component, ReactNode } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import SeasonalEffect from './components/SeasonalEffect';
import { ClickSoundProvider } from './components/ClickSoundProvider';
import ScrollToButtons from './components/ScrollToButtons';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminEdit from './pages/AdminEdit';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 可在此上报错误到监控系统
    void error;
    void info;
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">页面加载出错</h2>
            <p className="text-gray-500">请刷新页面重试</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ConditionalFooter: React.FC = () => {
  const location = useLocation();
  const isPostDetail = location.pathname.startsWith('/post/');
  if (isPostDetail) return null;
  return <Footer />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ClickSoundProvider>
        <div className="min-h-screen">
          <SeasonalEffect />
          <main className="pb-24">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/edit" element={<AdminEdit />} />
              <Route path="/admin/edit/:id" element={<AdminEdit />} />
            </Routes>
          </main>
          <ConditionalFooter />
          <ScrollToButtons />
        </div>
      </ClickSoundProvider>
    </ErrorBoundary>
  );
};

export default App;
