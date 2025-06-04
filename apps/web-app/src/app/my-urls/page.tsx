'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard';
import {
  Typography, Container, Box, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Tooltip, Paper, Divider, Link as MuiLink
} from '@mui/material'; // Added MuiLink, Divider
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'next/link'; 

interface ShortenedUrl {
  id: string;
  shortId: string;
  longUrl: string;
  fullShortUrl: string;
  clickCount: number;
  createdAt: string;
  userId?: string | null;
}

export default function MyUrlsPage() {
  const { user, isLoading: isAuthLoading, token } = useAuth();
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrls = async () => {
      if (!user || !token) {
        setIsLoadingUrls(false);
        return;
      }
      setIsLoadingUrls(true);
      setError(null);
      try {
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

    if (!isAuthLoading && user && token) {
      fetchUrls();
    } else if (!isAuthLoading && !user) {
      setIsLoadingUrls(false);
    }
  }, [user, token, isAuthLoading]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Short URL copied to clipboard!'))
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy URL.');
      });
  };

  if (isAuthLoading) {
    return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 128px)' }}><CircularProgress /></Box> );
  }
  if (!user) { // AuthGuard should handle this, but as a fallback
    return ( <Container maxWidth="md"><Box sx={{ my: 4, textAlign: 'center' }}><Typography variant="h6">Please log in to view your URLs.</Typography></Box></Container> );
  }

  return (
    <AuthGuard> 
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Shortened URLs
          </Typography>
          <Typography sx={{mt: 1, mb: 3}}>Welcome, {user.username || user.email}!</Typography>
          
          {isLoadingUrls && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
          )}

          {!isLoadingUrls && error && (
            <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
          )}

          {!isLoadingUrls && !error && urls.length === 0 && (
            <Typography sx={{ mt: 3, textAlign: 'center' }}>
              You haven't created any short URLs yet. Go ahead and <MuiLink component={Link} href="/">create some</MuiLink>!
            </Typography>
          )}

          {!isLoadingUrls && !error && urls.length > 0 && (
            <Paper elevation={2} sx={{ mt: 2 }}> {/* Added Paper for better visual grouping */}
              <List dense> {/* `dense` makes the list items a bit more compact */}
                {urls.map((url, index) => (
                  <React.Fragment key={url.id}>
                    <ListItem
                      sx={{ 
                        py: 1.5, // Add some padding
                        // Optional: hover effect
                        // '&:hover': {
                        //   backgroundColor: (theme) => theme.palette.action.hover,
                        // },
                      }}
                    >
                      <ListItemText
                        primary={
                          <MuiLink 
                            href={url.fullShortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            sx={{ fontWeight: 'medium', wordBreak: 'break-all', color: 'primary.main' }} // Use theme color
                          >
                            {url.fullShortUrl}
                          </MuiLink>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all', mt: 0.5 }}>
                              Original: {url.longUrl.length > 80 ? `${url.longUrl.substring(0, 80)}...` : url.longUrl}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                              Created: {new Date(url.createdAt).toLocaleDateString()} | Clicks: {url.clickCount}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction sx={{ right: { xs: 8, sm: 16 } }}> {/* Adjust spacing */}
                        <Tooltip title="Copy Short URL">
                          <IconButton edge="end" size="small" onClick={() => handleCopyToClipboard(url.fullShortUrl)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Original URL in new tab">
                          <IconButton 
                            edge="end" 
                            size="small" 
                            component="a" 
                            href={url.longUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ ml: 0.5 }}
                          >
                            <OpenInNewIcon fontSize="small"/>
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < urls.length - 1 && <Divider component="li" variant="inset" />} {/* variant="inset" or fullWidth */}
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