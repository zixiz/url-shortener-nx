import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from './features/core/components/layout/MainLayout.js';
import AuthGuard from './features/auth/components/AuthGuard.js';
import LoadingSpinner from '../src/features/core/components/LoadingSpinner.js';


import HomePage from './features/urls/pages/HomePage.js';
import NotFoundPage from './features/core/pages/NotFoundPage.js'; 

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage.js'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage.js'));
const MyUrlsPage = lazy(() => import('./features/urls/pages/MyUrlsPage.js'));
const StatsPage = lazy(() => import('./features/stats/pages/StatsPage.js'));

export function App() {
  return (
    <BrowserRouter>
      <MainLayout>
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