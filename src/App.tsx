import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import SeasonalEffect from './components/SeasonalEffect';
import { ClickSoundProvider } from './components/ClickSoundProvider';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminEdit from './pages/AdminEdit';

const App: React.FC = () => {
  return (
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
        <Footer />
      </div>
    </ClickSoundProvider>
  );
};

export default App;
