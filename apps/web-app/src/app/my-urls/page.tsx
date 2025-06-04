'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import {
  Typography, Container, Box, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Tooltip, Paper, Divider
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient'; // Assuming path alias for apiClient
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface ShortenedUrl {
  id: string;
  shortId: string;
  longUrl: string;
  fullShortUrl: string; // This comes from the API response
  clickCount: number;
  createdAt: string; 
  userId?: string | null; // userId is part of the API response
}

export default function MyUrlsPage() {
  const { user, isLoading: isAuthLoading, token } = useAuth(); // Added token
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrls = async () => {
      if (!user || !token) { // Ensure user and token are present before fetching
        // AuthGuard should handle redirection if not authenticated,
        // but this is a defensive check or handles edge cases.
        setIsLoadingUrls(false);
        return;
      }
      setIsLoadingUrls(true);
      setError(null);
      try {
        // apiClient already includes the Authorization header if token exists
        const response = await apiClient.get<ShortenedUrl[]>('/urls/mine');
        setUrls(response.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch URLs';
        setError(errorMessage);
        console.error("Error fetching user URLs:", err);
      } finally {
        setIsLoadingUrls(false);
      }
    };

    // Fetch URLs only when user is authenticated and auth is no longer loading
    if (!isAuthLoading && user && token) {
      fetchUrls();
    } else if (!isAuthLoading && !user) {
      // If auth is resolved and there's no user, no need to attempt fetch
      setIsLoadingUrls(false);
    }
    // Dependency array: re-fetch if user or token changes (e.g., after login)
    // or if isAuthLoading changes from true to false (initial auth check complete)
  }, [user, token, isAuthLoading]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Optional: Show a success notification (e.g., MUI Snackbar)
        alert('Short URL copied to clipboard!'); // Simple alert for now
      })
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy URL.');
      });
  };

  // This outer loading check is for the authentication status
  if (isAuthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 128px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  // AuthGuard will handle redirection if not authenticated.
  // If execution reaches here, user should be authenticated.
  return (
    <AuthGuard> 
      <Container maxWidth="lg"> {/* Changed to lg for more space for table/list */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Shortened URLs
          </Typography>
          <Typography sx={{mt: 1, mb: 3}}>Welcome, {user?.username || user?.email}!</Typography>
          
          {isLoadingUrls && ( // Loading state specifically for the URLs API call
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {!isLoadingUrls && error && (
            <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
          )}

          {!isLoadingUrls && !error && urls.length === 0 && (
            <Typography sx={{ mt: 3, textAlign: 'center' }}>
              You haven't created any short URLs yet. Go ahead and create some!
            </Typography>
          )}

          {!isLoadingUrls && !error && urls.length > 0 && (
            <Paper elevation={2} sx={{ mt: 2 }}>
              <List>
                {urls.map((url, index) => (
                  <React.Fragment key={url.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                            {url.fullShortUrl}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                              Original: {url.longUrl}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.disabled">
                              Created: {new Date(url.createdAt).toLocaleString()} | Clicks: {url.clickCount}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Copy Short URL">
                          <IconButton edge="end" aria-label="copy" onClick={() => handleCopyToClipboard(url.fullShortUrl)}>
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Original URL">
                          <IconButton 
                            edge="end" 
                            aria-label="open original" 
                            href={url.longUrl} // Direct link to original URL
                            target="_blank"     // Open in new tab
                            rel="noopener noreferrer" // Security best practice
                            sx={{ ml: 1 }}
                          >
                            <OpenInNewIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < urls.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Container>
    </AuthGuard>
  );
}