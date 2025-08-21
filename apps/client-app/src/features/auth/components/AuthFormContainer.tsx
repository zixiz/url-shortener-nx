
import { Container, Paper, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface AuthFormContainerProps {
  title: string;
  children: ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function AuthFormContainer({ title, children, onSubmit }: AuthFormContainerProps) {
  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">{title}</Typography>
        <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          {children}
        </Box>
      </Paper>
    </Container>
  );
}
