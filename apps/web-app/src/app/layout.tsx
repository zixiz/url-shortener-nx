import React from 'react';
import ThemeRegistry from './components/ThemeRegistry';
import MainLayout from './components/layout/MainLayout';
import './global.css';

export const metadata = {
  title: 'URL Shortener',
  description: 'Shorten your long URLs easily.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeRegistry>
          <MainLayout> 
            {children}
          </MainLayout>
        </ThemeRegistry>
      </body>
    </html>
  );
}