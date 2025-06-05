// apps/web-app/src/app/page.tsx
'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import {
  Container, Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, List, ListItem, ListItemText, IconButton, Link as MuiLink, Tooltip,
  Divider,ListItemSecondaryAction
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from '@/context/AuthContext'; // Using path alias
import apiClient from '@/lib/apiClient'; // Using path alias
import { useSnackbar } from '@/context/SnackbarContext';

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
  createdAt: number; 
}

const MAX_ANONYMOUS_LINKS = 5;
const ANONYMOUS_LINKS_STORAGE_KEY = 'anonymousUserLinks';

export default function HomePage() {
  const [longUrl, setLongUrl] = useState('');
  const [createdUrl, setCreatedUrl] = useState<CreatedUrlResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anonymousLinks, setAnonymousLinks] = useState<AnonymousLink[]>([]);
  const { showSnackbar } = useSnackbar();

  const { user: authenticatedUser, isLoading: isAuthLoading } = useAuth(); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedLinks = localStorage.getItem(ANONYMOUS_LINKS_STORAGE_KEY);
        if (storedLinks) {
          setAnonymousLinks(JSON.parse(storedLinks));
        }
      } catch (e) {
        console.error("Failed to parse anonymous links from localStorage", e);
        localStorage.removeItem(ANONYMOUS_LINKS_STORAGE_KEY);
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
      setLongUrl(''); 

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
      .then(() =>showSnackbar({ message: 'Short URL copied to clipboard!', severity: 'success', duration: 3000 }))
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        showSnackbar({ message: 'Failed to copy URL.', severity: 'error' });
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
              {anonymousLinks.map((link, index) => (
                <React.Fragment key={link.shortId}>
                  <ListItem 
                    sx={{ 
                      py: 1.5, 
                    }}
                  >
                    <ListItemText
                      primary={
                        <MuiLink href={link.fullShortUrl} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 'medium', wordBreak: 'break-all', color: 'primary.main' }}>
                          {link.fullShortUrl}
                        </MuiLink>
                      }
                      secondary={
                        <Typography component="span" variant="caption" sx={{ display: 'block', wordBreak: 'break-all', mt: 0.5 }}>
                          Original: {link.longUrl.length > 60 ? `${link.longUrl.substring(0, 60)}...` : link.longUrl}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction sx={{ right: { xs: 8, sm: 16 } }}>
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
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < anonymousLinks.length - 1 && <Divider component="li" variant="inset" />} 
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Container>
  );
}