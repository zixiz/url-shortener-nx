import { useState, useEffect } from 'react';
import UrlActions from '../components/UrlActions';
import MobileUrlCard from '../components/MobileUrlCard';
import AuthGuard from '../../auth/components/AuthGuard.js'; 
import {
  Typography, Container, Box, Alert,
  Paper, Link as MuiLink, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  useTheme, useMediaQuery, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../core/store/hooks.js'; 
import apiClient from '../../core/lib/apiClient.js';  

import { showSnackbar } from '../../core/store/uiSlice';

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
  const theme = useTheme(); // Hook to access the theme object for breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // True if screen width < 'sm' breakpoint

  const { user, token } = useAppSelector((state) => state.auth);
  const { isInitialAuthChecked } = useAppSelector((state) => state.ui); 

  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true);
  const [errorFetchingUrls, setErrorFetchingUrls] = useState<string | null>(null);
  const [urlToDelete, setUrlToDelete] = useState<ShortenedUrl | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchUrls = async () => {
      if (!token) { 
        setIsLoadingUrls(false);
        if (isInitialAuthChecked) setErrorFetchingUrls("Authentication token not found. Please log in again.");
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

  

  const handleDeleteClick = (url: ShortenedUrl) => {
    setUrlToDelete(url);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!urlToDelete) return;

    try {
      await apiClient.delete(`/urls/${urlToDelete.shortId}`);
      setUrls(urls.filter(url => url.id !== urlToDelete.id));
      dispatch(showSnackbar({ message: 'URL deleted successfully.', severity: 'success' }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete URL.';
      dispatch(showSnackbar({ message: errorMessage, severity: 'error' }));
    } finally {
      setConfirmOpen(false);
      setUrlToDelete(null);
    }
  };

  const renderSkeletonTableRows = () => (
    [...Array(3)].map((_, index) => (
      <TableRow key={`skeleton-row-${index}`}>
        <TableCell sx={{ width: '40%', py: 1.5 }}>
            <Skeleton variant="text" width="80%" />
        </TableCell>
        <TableCell sx={{ width: '35%', py: 1.5 }}>
            <Skeleton variant="text" width="70%" />
        </TableCell>
        <TableCell sx={{ width: '10%', py: 1.5 }}>
            <Skeleton variant="text" width="50%" />
        </TableCell>
        <TableCell align="right" sx={{ width: '15%', py: 1.5, pr: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton variant="circular" width={24} height={24} sx={{ mr: 0.5 }} />
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
        </TableCell>
      </TableRow>
    ))
  );

  // AuthGuard handles loading and redirection based on auth state
  return (
    <AuthGuard> 
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          {user && (
            <Typography variant="h5" component="h1" gutterBottom>Welcome, {user.username || user.email}!</Typography>
          )}
          <Typography variant="h4" component="h2" gutterBottom sx={{ mt: user ? 2 : 0 }}>
            My Shortened URLs
          </Typography>
          
          {errorFetchingUrls && !isLoadingUrls && (
            <Alert severity="error" sx={{ my: 2 }}>{errorFetchingUrls}</Alert>
          )}

          {isMobile ? (
            // Mobile: Card layout
            <Box sx={{ mt: 2 }}>
              {isLoadingUrls ? (
                // Mobile skeleton loading
                [...Array(3)].map((_, index) => (
                  <Box key={`mobile-skeleton-${index}`} sx={{ mb: 2 }}>
                    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
                  </Box>
                ))
              ) : urls.length === 0 && isInitialAuthChecked && user ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography>
                    You haven't created any short URLs yet. Go ahead and <MuiLink component={RouterLink} to="/">create some</MuiLink>!
                  </Typography>
                </Box>
              ) : (
                urls.map((url) => (
                  <MobileUrlCard 
                    key={url.id} 
                    url={url} 
                    onDelete={() => handleDeleteClick(url)}
                    showStats={true}
                  />
                ))
              )}
            </Box>
          ) : (
            // Desktop: Table layout
            <TableContainer component={Paper} elevation={2} sx={{ 
              mt: 2, 
              border: 1, 
              borderColor: 'divider', 
              borderRadius: '12px',
              overflowX: 'auto'
            }}>
              <Table sx={{ minWidth: 700 }} aria-label="my shortened urls table" >
                <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'medium', width: '40%', py:1, px:2 }}>Original URL</TableCell>
                    <TableCell sx={{ fontWeight: 'medium', width: '35%', py:1, px:2 }}>Shortened URL</TableCell>
                    <TableCell sx={{ fontWeight: 'medium', width: '10%', py:1, px:2 }}>Clicks</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium', width: '15%', py:1, pr: 2, pl:1 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingUrls ? (
                    renderSkeletonTableRows()
                  ) : urls.length === 0 && isInitialAuthChecked && user ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography sx={{ mt: 0, textAlign: 'center' }}>
                          You haven't created any short URLs yet. Go ahead and <MuiLink component={RouterLink} to="/">create some</MuiLink>!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    urls.map((url) => (
                      <TableRow
                        key={url.id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: theme.palette.action.hover } }}
                      >
                        <TableCell 
                          component="th" 
                          scope="row"
                          sx={{ 
                            py: 1.5, px:2,
                            wordBreak: 'break-all', 
                            maxWidth: '350px',
                            minWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={url.longUrl}
                        >
                          {url.longUrl}
                        </TableCell>
                        <TableCell sx={{ wordBreak: 'break-all', py: 1.5, px:2 }}>
                          <MuiLink 
                            href={url.fullShortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            sx={{ fontWeight: 'medium', color: 'primary.main' }}
                          >
                            {url.fullShortUrl}
                          </MuiLink>
                        </TableCell>
                        <TableCell sx={{py: 1.5, px:2}}>
                          <MuiLink component={RouterLink} to={`/stats?id=${url.shortId}`} sx={{ fontWeight: 'medium', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                            {url.clickCount}
                          </MuiLink>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', pr: 1, py: 1.5, pl:1 }}>
                          <UrlActions url={url} onDelete={() => handleDeleteClick(url)} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Container>
      <Dialog
        open={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this URL? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AuthGuard>
  );
}