import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.js'; // Path to your MainLayout
import AuthGuard from '../components/AuthGuard.js';
// Import Page Components
// Ensure these paths are correct relative to app.tsx
import HomePage from '../pages/HomePage.js';
import LoginPage from '../pages/LoginPage.js';
import RegisterPage from '../pages/RegisterPage.js';
import MyUrlsPage from '../pages/MyUrlsPage.js';
import StatsPage from '../pages/StatsPage.js';
import NotFoundPage from '../pages/NotFoundPage.js'; 

export function App() {
  return (
    <BrowserRouter>
      <MainLayout> {/* MainLayout now wraps all routed content */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/my-urls" element={
            <AuthGuard>
              <MyUrlsPage />
            </AuthGuard>
            } />
          <Route path="/stats" element={<StatsPage />} />
          
          <Route path="/404" element={<NotFoundPage />} />
          {/* Navigate to /404 for any unmatched route */}
          <Route path="*" element={<Navigate to="/404" replace />} /> 
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;