"use client"; 

import { Button, Typography, Container } from '@mui/material';

export default function HomePage() {
  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        Welcome to URL Shortener! (App Router)
      </Typography>
      <Typography variant="h5" component="h2" color="text.secondary" paragraph>
        Shorten your long URLs with ease.
      </Typography>
      
      <Button variant="contained" color="primary" sx={{ mr: 1 }} onClick={() => alert('MUI Button Clicked!')}>
        MUI Primary Button
      </Button>
      <Button variant="contained" color="secondary">
        MUI Secondary Button
      </Button>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <p className="text-lg text-black dark:text-white">
          This div is styled with Tailwind CSS!
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          It supports dark mode via Tailwind's `dark:` prefix.
        </p>
      </div>
    </Container>
  );
}