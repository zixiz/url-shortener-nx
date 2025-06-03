import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '../theme/theme'; 
import './global.css'; 

// This will be replaced by a context later for dynamic theme switching
const initialMode = 'light'; // Default to light mode

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = createAppTheme(initialMode); 

  return (
    <html lang="en">
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      {/* <head />  // Next.js 13+ often uses metadata API instead of <Head> directly in layout */}
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}