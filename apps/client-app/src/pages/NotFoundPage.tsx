import { Typography, Container, Button } from '@mui/material';
import { Link } from 'react-router-dom'; // Use react-router-dom Link

export default function NotFound() {
  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="h5" component="p" color="text.secondary" paragraph>
        Oops! The page you're looking for doesn't exist.
      </Typography>
      <Button component={Link} to="/" variant="contained" color="primary">
        Go Home
      </Button>
    </Container>
  );
}