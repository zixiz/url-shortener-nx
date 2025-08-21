
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingIndicatorProps {
  height?: string;
  message?: string;
}

export default function LoadingIndicator({ height = '80vh', message }: LoadingIndicatorProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
      <CircularProgress />
      {message && <Typography sx={{ ml: 2 }}>{message}</Typography>}
    </Box>
  );
}
