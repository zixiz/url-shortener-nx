'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import {
  Container, Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, List, ListItem, ListItemText, IconButton, Link as MuiLink, Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';

interface CreatedUrlResponse {
  id: string;
  shortId: string;
  longUrl: string;
  fullShortUrl: string;
  userId?: string | null;
}

interface AnonymousLink {
  shortId: string;
  longUrl: string;
  fullShortUrl: string;
  createdAt: number; // Timestamp for sorting or auto-removal
}

const MAX_ANONYMOUS_LINKS = 5;
const ANONYMOUS_LINKS_STORAGE_KEY = 'anonymousUserLinks';

export default function HomePage() {
  const [longUrl, setLongUrl] = useState('');
  const [createdUrl, setCreatedUrl] = useState<CreatedUrlResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anonymousLinks, setAnonymousLinks] = useState<AnonymousLink[]>([]);

  const { user: authenticatedUser, isLoading: isAuthLoading } = useAuth(); 

  // Load anonymous links from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') { // Ensure localStorage is available
      try {
        const storedLinks = localStorage.getItem(ANONYMOUS_LINKS_STORAGE_KEY);
        if (storedLinks) {
          setAnonymousLinks(JSON.parse(storedLinks));
        }
      } catch (e) {
        console.error("Failed to parse anonymous links from localStorage", e);
        localStorage.removeItem(ANONYMOUS_LINKS_STORAGE_KEY); // Clear corrupted data
      }
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setCreatedUrl(null);

    try {
      const response = await apiClient.post<CreatedUrlResponse>('/urls', { longUrl });
      setCreatedUrl(response.data);

      // If user is anonymous and URL was created successfully, add to localStorage
      if (!authenticatedUser && response.data) {
        const newLink: AnonymousLink = {
          shortId: response.data.shortId,
          longUrl: response.data.longUrl,
          fullShortUrl: response.data.fullShortUrl,
          createdAt: Date.now(),
        };
        
        setAnonymousLinks(prevLinks => {
          const updatedLinks = [newLink, ...prevLinks].slice(0, MAX_ANONYMOUS_LINKS);
          if (typeof window !== 'undefined') {
            localStorage.setItem(ANONYMOUS_LINKS_STORAGE_KEY, JSON.stringify(updatedLinks));
          }
          return updatedLinks;
        });
      }
      setLongUrl(''); // Clear input field on success

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to shorten URL. Please ensure it is a valid URL.';
      setError(errorMessage);
      console.error("Error creating short URL:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Short URL copied to clipboard!'))
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy URL.');
      });
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          URL Shorty
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Enter your long URL to get a shortened version.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="longUrl"
            label="Your Long URL (e.g., https://example.com/very/long/path)"
            name="longUrl"
            autoFocus
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            disabled={isLoading}
            placeholder="https://..."
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 2, mb: 2, py: 1.5 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Shorten URL'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {createdUrl && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: 'success.light', color: 'success.contrastText' }}>
          <Typography variant="h6" gutterBottom>Your Shortened URL:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <MuiLink href={createdUrl.fullShortUrl} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 'bold', color: 'success.contrastText', wordBreak: 'break-all' }}>
              {createdUrl.fullShortUrl}
            </MuiLink>
            <Tooltip title="Copy Short URL">
              <IconButton onClick={() => handleCopyToClipboard(createdUrl.fullShortUrl)} size="small" sx={{ color: 'success.contrastText' }}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
             <Tooltip title="Open Short URL">
               <IconButton 
                component="a" 
                href={createdUrl.fullShortUrl} 
                target="_blank" rel="noopener noreferrer" 
                size="small" 
                sx={{ color: 'success.contrastText' }}
              >
                <OpenInNewIcon fontSize="small"/>
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" display="block" sx={{ mt: 1, wordBreak: 'break-all' }}>
            Original: {createdUrl.longUrl}
          </Typography>
        </Paper>
      )}

      {!isAuthLoading && !authenticatedUser && anonymousLinks.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{mt: 4}}>
            My Recent Anonymous Links
          </Typography>
          <Paper elevation={1}>
            <List dense>
              {anonymousLinks.map((link) => (
                <ListItem 
                  key={link.shortId}
                  secondaryAction={
                    <>
                      <Tooltip title="Copy Short URL">
                        <IconButton edge="end" size="small" onClick={() => handleCopyToClipboard(link.fullShortUrl)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                       <Tooltip title="Open Short URL">
                         <IconButton 
                          edge="end" 
                          size="small" 
                          component="a" 
                          href={link.fullShortUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{ ml: 0.5 }}
                        >
                          <OpenInNewIcon fontSize="small"/>
                        </IconButton>
                      </Tooltip>
                    </>
                  }
                >
                  <ListItemText
                    primary={
                      <MuiLink href={link.fullShortUrl} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 'medium', wordBreak: 'break-all' }}>
                        {link.fullShortUrl}
                      </MuiLink>
                    }
                    secondary={
                      <Typography component="span" variant="caption" sx={{ display: 'block', wordBreak: 'break-all' }}>
                        Original: {link.longUrl.length > 60 ? `${link.longUrl.substring(0, 60)}...` : link.longUrl}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Container>
  );
}