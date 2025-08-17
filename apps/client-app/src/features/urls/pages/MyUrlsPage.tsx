import { useState, useEffect } from 'react';
import AuthGuard from '../../auth/components/AuthGuard.js'; 
import {
  Typography, Container, Box, Alert,
  IconButton, Tooltip, Paper, Link as MuiLink, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  useTheme, useMediaQuery, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // For internal navigation <MuiLink component={RouterLink} ...>
import { useAppSelector, useAppDispatch } from '../../core/store/hooks.js'; // Adjust path as needed
import apiClient from '../../core/lib/apiClient.js';      // Adjust path as needed
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import { showSnackbar } from '../../core/store/snackbarSlice';

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

  const { user, token, isInitialAuthChecked } = useAppSelector((state) => state.auth); 

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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => dispatch(showSnackbar({ message: 'Short URL copied to clipboard!', severity: 'success', duration: 3000 })))
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        dispatch(showSnackbar({ message: 'Failed to copy URL.', severity: 'error' }));
      });
  };

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
        <TableCell sx={{ width: isMobile ? '60%' : '40%', py: 1.5 }}> {/* Adjust py for consistency */}
            <Skeleton variant="text" width="80%" />
            {isMobile && <Skeleton variant="text" width="70%" sx={{mt: 0.5, fontSize: '0.8rem'}}/>}
            {isMobile && <Skeleton variant="text" width="50%" sx={{mt: 0.5, fontSize: '0.7rem'}}/>}
        </TableCell>
        {!isMobile && ( // Only render these skeleton cells if not mobile
            <>
                <TableCell sx={{ width: '35%', py: 1.5 }}><Skeleton variant="text" width="70%" /></TableCell>
                <TableCell sx={{ width: '15%', py: 1.5 }}><Skeleton variant="text" width="50%" /></TableCell>
            </>
        )}
        <TableCell align="right" sx={{ width: isMobile ? '40%' : '10%', py: 1.5, pr: {xs: 1, sm: 2} }}>
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

          <TableContainer component={Paper} elevation={2} sx={{ 
            mt: 2, 
            border: 1, 
            borderColor: 'divider', 
            borderRadius: '12px',
            overflowX: 'auto' // Ensure horizontal scroll on very small if table minWidth is too large
          }}>
            <Table sx={{ minWidth: isMobile ? 320 : 700 }} aria-label="my shortened urls table" >
              <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium', width: isMobile ? 'calc(100% - 80px)' : '40%', py:1, px:2 }}>Original URL {isMobile && "/ Short URL / Clicks"}</TableCell>
                  {!isMobile && <TableCell sx={{ fontWeight: 'medium', width: '35%', py:1, px:2 }}>Shortened URL</TableCell>}
                  {!isMobile && <TableCell sx={{ fontWeight: 'medium', width: '10%', py:1, px:2 }}>Clicks</TableCell>}
                  <TableCell align="right" sx={{ fontWeight: 'medium', width: isMobile ? '80px' : '15%', py:1, pr: {xs: 1, sm: 2}, pl:1 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingUrls ? (
                  renderSkeletonTableRows()
                ) : urls.length === 0 && isInitialAuthChecked && user ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 2 : 4} align="center" sx={{ py: 3 }}>
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
                          maxWidth: isMobile ? 'calc(100vw - 120px)' : '350px', // Adjust max width
                          minWidth: isMobile ? '150px': '200px', // Give it some minWidth
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={url.longUrl}
                      >
                        {url.longUrl}
                        {isMobile && (
                          <>
                            <MuiLink 
                              href={url.fullShortUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              sx={{ display: 'block', fontWeight: 'medium', color: 'primary.main', mt: 0.5, fontSize: '0.8rem', wordBreak: 'break-all' }}
                            >
                              {url.fullShortUrl}
                            </MuiLink>
                            <Typography component="span" variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                              Clicks: {url.clickCount}
                            </Typography>
                          </>
                        )}
                      </TableCell>
                      {!isMobile && (
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
                      )}
                      {!isMobile && <TableCell sx={{py: 1.5, px:2}}>{url.clickCount}</TableCell>}
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', pr: {xs:1, sm:1}, py: 1.5, pl:1 }}>
                        <Tooltip title="Copy Short URL">
                          <IconButton sx={{p: {xs: 0.5, sm: 1}}} size="small" onClick={() => handleCopyToClipboard(url.fullShortUrl)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Original URL">
                          <IconButton 
                            sx={{p: {xs: 0.5, sm: 1}, ml: {xs: 0, sm: 0.5}}}
                            size="small" 
                            component="a" 
                            href={url.longUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <OpenInNewIcon fontSize="small"/>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete URL">
                          <IconButton
                            sx={{p: {xs: 0.5, sm: 1}, ml: {xs: 0, sm: 0.5}}}
                            size="small"
                            onClick={() => handleDeleteClick(url)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
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