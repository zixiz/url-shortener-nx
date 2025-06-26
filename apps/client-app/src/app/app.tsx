import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '../components/layout/MainLayout.js'; // Path to your MainLayout
import AuthGuard from '../components/AuthGuard.js';
import LoadingSpinner from '../components/LoadingSpinner.js';

// Eagerly load the main pages
import HomePage from '../pages/HomePage.js';
import NotFoundPage from '../pages/NotFoundPage.js'; 

// Lazy load other pages
const LoginPage = lazy(() => import('../pages/LoginPage.js'));
const RegisterPage = lazy(() => import('../pages/RegisterPage.js'));
const MyUrlsPage = lazy(() => import('../pages/MyUrlsPage.js'));
const StatsPage = lazy(() => import('../pages/StatsPage.js'));

export function App() {
  return (
    <BrowserRouter>
      <MainLayout> {/* MainLayout now wraps all routed content */}
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/my-urls" element={
              <AuthGuard>
                <MyUrlsPage />
              </AuthGuard>
            } />
            <Route path="/stats" element={
              <AuthGuard>
                <StatsPage />
              </AuthGuard>
            } />
            
            <Route path="/404" element={<NotFoundPage />} />
            {/* Navigate to /404 for any unmatched route */}
            <Route path="*" element={<Navigate to="/404" replace />} /> 
          </Routes>
        </Suspense>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;