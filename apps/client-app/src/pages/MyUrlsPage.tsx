import React, { useState, useEffect } from 'react';
import AuthGuard from '../components/AuthGuard';
import {
  Typography, Container, Box, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Tooltip, Paper, Divider, Link as MuiLink,
  Skeleton 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import apiClient from '../lib/apiClient'; 
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSnackbar } from '../context/SnackbarContext';

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
  const { user, token, isInitialAuthChecked } = useAppSelector((state) => state.auth); 

  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true);
  const [errorFetchingUrls, setErrorFetchingUrls] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchUrls = async () => {
      if (!token) { 
        setIsLoadingUrls(false);
        return;
      }

      setIsLoadingUrls(true);
      setErrorFetchingUrls(null);
      try {
        const response = await apiClient.get<ShortenedUrl[]>('/urls/mine');
        setUrls(response.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch your URLs.';
        setErrorFetchingUrls(errorMessage);
        console.error("Error fetching user URLs:", err);
      } finally {
        setIsLoadingUrls(false);
      }
    };

    if (isInitialAuthChecked && token && user) {
      fetchUrls();
    } else if (isInitialAuthChecked && (!token || !user)) {
      setIsLoadingUrls(false); 
    }
  }, [token, user, isInitialAuthChecked]); 

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => showSnackbar({ message: 'Short URL copied to clipboard!', severity: 'success', duration: 3000 }))
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        showSnackbar({ message: 'Failed to copy URL.', severity: 'error' });
      });
  };

  const renderSkeletons = () => (
    <Paper elevation={2} sx={{ mt: 2 }}>
      <List dense>
        {[...Array(3)].map((_, index) => (
          <React.Fragment key={`skeleton-${index}`}>
            <ListItem sx={{ py: 1.5 }}>
              <ListItemText
                primary={<Skeleton variant="text" width="60%" sx={{ fontSize: '1rem' }} />}
                secondary={
                  <>
                    <Skeleton variant="text" width="80%" sx={{ mt: 0.5 }} />
                    <Skeleton variant="text" width="40%" sx={{ mt: 0.5 }} />
                  </>
                }
              />
              <ListItemSecondaryAction sx={{ right: { xs: 8, sm: 16 } }}>
                <Skeleton variant="circular" width={24} height={24} sx={{mr: 0.5}} />
                <Skeleton variant="circular" width={24} height={24} />
              </ListItemSecondaryAction>
            </ListItem>
            {index < 2 && <Divider component="li" variant="inset" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );

  return (
    <AuthGuard> 
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          {user && (
            <Typography component="h1" variant="h5" gutterBottom>Welcome, {user.username || user.email}!</Typography>
          )}
          <Typography variant="h5" component="h2" gutterBottom>
            My Shortened URLs
          </Typography>
          
          {isLoadingUrls ? (
            renderSkeletons()
          ) : errorFetchingUrls ? (
            <Alert severity="error" sx={{ my: 2 }}>{errorFetchingUrls}</Alert>
          ) : urls.length === 0 ? (
            <Typography sx={{ mt: 3, textAlign: 'center' }}>
              You haven't created any short URLs yet. Go ahead and <MuiLink component={RouterLink} to="/">create some</MuiLink>!
            </Typography>
          ) : (
            <Paper elevation={2} sx={{ mt: 2 }}>
              <List dense>
                {urls.map((url, index) => (
                  <React.Fragment key={url.id}>
                    <ListItem
                      sx={{ 
                        py: 1.5,
                      }}
                    >
                      <ListItemText
                        primary={
                          <MuiLink 
                            href={url.fullShortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            sx={{ fontWeight: 'medium', wordBreak: 'break-all', color: 'primary.main' }}
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
                      <ListItemSecondaryAction sx={{ right: { xs: 8, sm: 16 } }}>
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
                    {index < urls.length - 1 && <Divider component="li" variant="inset" />}
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