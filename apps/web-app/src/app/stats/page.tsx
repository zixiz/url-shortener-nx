// apps/web-app/src/app/stats/page.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import {
  Container, Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, Card, CardContent, Grid
} from '@mui/material';
import apiClient from '@/lib/apiClient'; // Assuming path alias

interface UrlStats {
  shortId: string;
  longUrl?: string; // Make longUrl optional as API might not always return it if only clicks are fetched
  clickCount: number;
}

export default function StatsPage() {
  const [inputShortId, setInputShortId] = useState('');
  const [urlStats, setUrlStats] = useState<UrlStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputShortId.trim()) {
      setError('Please enter a Short ID.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setUrlStats(null);

    try {
      // The API endpoint is /api/stats/:shortId
      const response = await apiClient.get<UrlStats>(`/stats/${inputShortId.trim()}`);
      setUrlStats(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch stats or Short ID not found.';
      setError(errorMessage);
      console.error("Error fetching URL stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          URL Click Statistics
        </Typography>
        <Typography color="text.secondary">
          Enter a Short ID to view its click count.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="shortIdInput"
            label="Short ID"
            name="shortIdInput"
            autoFocus
            value={inputShortId}
            onChange={(e) => setInputShortId(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., fVu-PkW6Ihy"
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {urlStats && (
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
            <Typography variant="h3" component="p" color="secondary.main" sx={{ fontWeight: 'bold', my: 2 }}>
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