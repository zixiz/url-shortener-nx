import { useState, FormEvent, useEffect } from 'react';
import {
  Container, Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, Card, CardContent 
} from '@mui/material';
import apiClient from '../lib/apiClient.js'; 

interface UrlStats {
  shortId: string;
  longUrl?: string; 
  clickCount: number;
}
const APP_BASE_URL = (import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3003').replace(/\/$/, "");

export default function StatsPage() {
  const [inputFieldValue, setInputFieldValue] = useState('');
  const [urlStats, setUrlStats] = useState<UrlStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial state from URL params on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shortIdFromUrl = urlParams.get('id');
    if (shortIdFromUrl) {
      setInputFieldValue(shortIdFromUrl);
      fetchStats(shortIdFromUrl);
    }
  }, []);

  const updateUrlParams = (shortId: string) => {
    const url = new URL(window.location.href);
    if (shortId) {
      url.searchParams.set('id', shortId);
    } else {
      url.searchParams.delete('id');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const fetchStats = async (shortId: string) => {
    let processedShortId = shortId.trim();

    if (!processedShortId) {
      setError('Please enter a Short URL or ID.');
      setUrlStats(null);
      return;
    }

    if (processedShortId.startsWith(APP_BASE_URL + '/')) {
      processedShortId = processedShortId.substring((APP_BASE_URL + '/').length);
    }
    
    if (!processedShortId || processedShortId === '/') {
      setError('Invalid Short URL format. Please enter just the ID part or the full short URL.');
      setUrlStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setUrlStats(null);

    try {
      const response = await apiClient.get<UrlStats>(`/stats/${processedShortId}`);
      setUrlStats(response.data);
      
      // Update URL params to persist the search
      updateUrlParams(processedShortId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch stats or Short ID not found.';
      setError(errorMessage);
      console.error("Error fetching URL stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchStats(inputFieldValue);
  };

  const handleInputChange = (value: string) => {
    setInputFieldValue(value);
    if (error) setError(null);
    if (urlStats) setUrlStats(null);
    
    if (!value.trim()) {
      updateUrlParams('');
    }
  };

  return (
    <Container maxWidth="sm" sx={{pt: 2, pb: 4}}> 
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          URL Click Statistics
        </Typography>
        <Typography color="text.secondary" paragraph>
          Enter a Short URL or ID to view its click count.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="shortIdInput"
            label="Short URL or ID"
            name="shortIdInput"
            autoFocus
            value={inputFieldValue}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={isLoading}
            placeholder={`e.g., ${APP_BASE_URL}/xYz123Abc or xYz123Abc`}
            error={!!error} // Highlight field if there's an error related to this form
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 2, mb: 2, py: 1.5 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Get Stats'}
          </Button>
        </Box>
      </Paper>

      {/* Display local pageError */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Display Loading for stats specifically after submit */}
      {isLoading && !urlStats && !error && (
         <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
            <Typography sx={{ml: 2}}>Fetching stats...</Typography>
         </Box>
      )}

      {urlStats && !isLoading && ( // Only show stats card if not loading and stats are present
        <Card elevation={3} sx={{ mt: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" component="div" gutterBottom>
              Stats for: <Typography component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{urlStats.shortId}</Typography>
            </Typography>
            {urlStats.longUrl && (
               <Typography variant="body2" color="text.secondary" sx={{mb:1, wordBreak: 'break-all'}}>
                Original URL: {urlStats.longUrl}
               </Typography>
            )}
            <Typography variant="h3" component="p" color="text.primary" sx={{ fontWeight: 'bold', my: 2 }}>
              {urlStats.clickCount}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Clicks
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}