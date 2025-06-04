// apps/web-app/src/app/page.tsx
"use client"; 

import { Button, Typography, Container } from '@mui/material';
import { useAuth } from '@/context/AuthContext'; // Assuming path alias

export default function HomePage() {
  const { isLoading, user, error, token } = useAuth(); // Consume the context

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        Welcome to URL Shortener! (App Router)
      </Typography>
      <Typography variant="h5" component="h2" color="text.secondary" paragraph>
        Shorten your long URLs with ease.
      </Typography>

      {/* Display Auth State for Debugging */}
      <div className="my-4 p-2 border">
        <p>Auth Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>User: {user ? user.email : 'Not logged in'}</p>
        <p>Token: {token ? 'Exists' : 'None'}</p>
        {error && <p style={{ color: 'red' }}>Auth Error: {error}</p>}
      </div>
      
      <Button variant="contained" color="primary" sx={{ mr: 1 }} onClick={() => alert('MUI Button Clicked!')}>
        MUI Primary Button
      </Button>
      {/* ... rest of your page ... */}
    </Container>
  );
}