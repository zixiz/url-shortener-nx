import { useState, FormEvent, useEffect, useRef } from 'react';
import {
  Container, Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, IconButton, Link as MuiLink, Tooltip,
  InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, Fade, LinearProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import { useAppSelector, useAppDispatch } from '../store/hooks.js'; 
import apiClient from '../lib/apiClient.js';
import { useSnackbar } from '../context/SnackbarContext.js';
import { useThemeMode } from '../components/ViteThemeRegistry.js';
import { useTheme } from '@mui/material/styles';
import {
  createShortUrlRequest,
  createShortUrlSuccess,
  createShortUrlFailure,
  hideCreatedUrl,
  updateShortenTimestamps,
  clearRateLimit,
} from '../store/shortenUrlSlice.js';

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
const AUTO_HIDE_DURATION = 10000;

// Image URL from the Stitch example - ENSURE YOU HAVE RIGHTS TO USE OR REPLACE
const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuC5oYzQi-XEkOhBaLGMWgGitAnx3gRVoqWT098YNvzmwhSvI4AWSJnk4FymirDetf-TBGRvO0KY0l7GzLNv70NYcKLFWDSWMqMqbd8VySlbFads8r3AWJGgU7UTAKsuq_RVYD_aR-ivg69UqK2Woe79CfeW0Hlzfj52JSx-lavobiO6salvSj5OpTQ8xsJb2sNa6dbJvrMXYMFD-z5iw2Y3L8Lzn8a9OWmGWvN3hnQIpMczakixWwnEOnO1iMV1NbLD3bW_A5mE8tQ";

export default function HomePage() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  // Local state for form and UI
  const [longUrl, setLongUrl] = useState('');
  const [isFormLoading, setIsFormLoading] = useState(false); 
  const [anonymousLinks, setAnonymousLinks] = useState<AnonymousLink[]>([]);
  const [progress, setProgress] = useState(100);
  const [createdUrlKey, setCreatedUrlKey] = useState(0);
  
  // Redux state
  const { 
    createdUrl, 
    showCreatedUrl, 
    isRateLimited, 
    formError 
  } = useAppSelector((state) => state.shortenUrl);
  const { user: authenticatedUser, isInitialAuthChecked } = useAppSelector((state) => state.auth);
  
  const { showSnackbar } = useSnackbar();
  const { mode } = useThemeMode(); 
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load anonymous links from localStorage
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

  // Auto-hide effect for created URL
  useEffect(() => {
    if (createdUrl && showCreatedUrl) {
      // Clear any existing timers
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      // Reset progress and increment key for animation
      setProgress(100);
      setCreatedUrlKey(prev => prev + 1);

      // Start progress countdown
      const progressStep = 100 / (AUTO_HIDE_DURATION / 100);
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - progressStep;
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      // Set hide timeout
      hideTimeoutRef.current = setTimeout(() => {
        dispatch(hideCreatedUrl());
        setProgress(100);
      }, AUTO_HIDE_DURATION);
    }

    // Cleanup on unmount or when createdUrl changes
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [createdUrl, showCreatedUrl, dispatch]);

  // Clear rate limit after some time
  useEffect(() => {
    if (isRateLimited) {
      const timer = setTimeout(() => {
        dispatch(clearRateLimit());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isRateLimited, dispatch]);

  const handleManualClose = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    dispatch(hideCreatedUrl());
    setProgress(100);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!longUrl.trim()) {
      dispatch(createShortUrlFailure("Please enter a URL to shorten."));
      return;
    }

    // Check rate limiting
    const now = Date.now();
    dispatch(updateShortenTimestamps(now));
    
    // If rate limited after timestamp update, don't proceed
    if (isRateLimited) {
      return;
    }

    setIsFormLoading(true);
    dispatch(createShortUrlRequest());
    
    // Clear any existing timers before starting new ones
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    try {
      const response = await apiClient.post<CreatedUrlResponse>('/urls', { longUrl });
      
      dispatch(createShortUrlSuccess(response.data));
      showSnackbar({ message: 'URL Shortened Successfully!', severity: 'success', duration: 3000 });

      // Handle anonymous links storage
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
      dispatch(createShortUrlFailure(errorMessage));
      console.error("Error creating short URL:", err);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => showSnackbar({ message: 'Short URL copied to clipboard!', severity: 'success', duration: 3000 }))
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        showSnackbar({ message: 'Failed to copy URL.', severity: 'error' });
      });
  };
  
  useEffect(() => {
    // Cleanup feedback state when HomePage unmounts (e.g., on navigation)
    return () => {
      dispatch(hideCreatedUrl());
    };
  }, [dispatch]);

  if (!isInitialAuthChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{pt: {xs: 0, md: 0}, pb: 4, px: {xs: 0, sm: 2} }}>
        
        {/* Hero Section */}
        <Box 
          sx={{
            minHeight: { xs: '400px', sm: '480px' },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, sm: 3 }, 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%), url("${HERO_IMAGE_URL}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: { xs: 0, sm: '12px' }, 
            alignItems: 'flex-start', 
            justifyContent: 'flex-end', 
            p: { xs: 3, sm: 5, md: 6 }, 
            color: 'white',
            mb: 6, 
          }}
        >
          <Box> 
            <Typography
              variant="h2" 
              component="h1"
              sx={{ 
                fontWeight: 900, 
                lineHeight: {xs: 1.1, sm: 'tight'}, 
                letterSpacing: '-0.033em',
                mb: 1,
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' } 
              }}
            >
              Shorten long URLs
            </Typography>
            <Typography
              variant="h6" 
              component="h2"
              sx={{ 
                lineHeight: 'normal',
                maxWidth: '55ch', 
                fontWeight: 400, 
                fontSize: {xs: '0.875rem', sm: '1rem'} 
              }}
            >
              URL Shorty allows you to shorten long links from websites like Facebook, YouTube, Twitter, LinkedIn and top sites on the Internet, making your links easier to share.
            </Typography>
          </Box>

          {/* Form within Hero */}
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            noValidate 
            sx={{ 
              width: '100%', 
              maxWidth: { xs: '100%', sm: '480px' },
              display: 'flex',
              borderRadius: '12px', 
              overflow: 'hidden', 
              border: 1,
              borderColor: mode === 'light' ? 'grey.400' : 'grey.700', 
              backgroundColor: mode === 'light' ? 'common.white' : 'grey.800', 
              height: { xs: '3.5rem', sm: '4rem' }, 
            }}
          >
            <TextField
              fullWidth
              id="longUrlHero"
              variant="outlined"
              placeholder="Paste a link here"
              value={longUrl}
              onChange={(e) => {
                setLongUrl(e.target.value);
                // Clear form error when user starts typing
                if (formError) {
                  dispatch(clearRateLimit());
                }
              }}
              disabled={isFormLoading || isRateLimited}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ml:1}}>
                    <SearchIcon sx={{ color: mode === 'light' ? 'grey.600' : 'grey.400' }} />
                  </InputAdornment>
                ),
                sx: { 
                  border: 'none', 
                  borderRadius: 0, 
                  backgroundColor: 'transparent',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  height: '100%',
                  color: 'text.primary',
                  '& input::placeholder': { color: 'text.secondary' },
                  '& .MuiInputBase-input': { pl: 1, pr: 0.5 }
                }
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              type="submit"
              variant="contained" 
              color={mode === 'light' ? 'secondary' : 'primary'}
              size="large" 
              disabled={isFormLoading || isRateLimited}
              sx={{ 
                minWidth: {xs: '80px', sm: '100px'},
                height: '100%',
                px: { xs: 2, sm: 3 },
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: '10px',
                borderBottomRightRadius: '10px',
                boxShadow: 'none',
                fontWeight: 'bold',
                ...(mode === 'light' && {
                    backgroundColor: '#dce8f3', 
                    color: '#101518',
                    '&:hover': { backgroundColor: '#C5D9E9' }
                }),
              }}
            >
              {isFormLoading ? <CircularProgress size={24} color="inherit" /> : 'Shorten'}
            </Button>
          </Box>
        </Box>
        
        {/* Form Error Display */}
        {formError && (
          <Alert severity="error" sx={{ mb: 3, mt: 2 }}>{formError}</Alert>
        )}

        {/* Created URL Display with Auto-Hide */}
        <Collapse in={showCreatedUrl} timeout={300}>
          <Fade in={showCreatedUrl} timeout={300}>
            <Paper key={createdUrlKey} elevation={3} 
              sx={{ 
                p: 3, 
                mb: 4,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: theme.palette.mode === 'light' ? 'primary.light' : theme.palette.action.selected,
                borderRadius: '8px',
                border: `1px solid ${theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.divider}`,
              }}
            >
              {/* Progress bar at the top */}
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: theme.palette.mode === 'light' ? 'primary.lighter' : 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.mode === 'light' ? 'primary.main' : 'primary.light',
                  }
                }}
              />
              
              {/* Close button */}
              <IconButton
                onClick={handleManualClose}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: theme.palette.mode === 'light' ? 'primary.dark' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light' ? 'primary.dark' : 'action.hover',
                    color: theme.palette.mode === 'light' ? 'primary.light' : 'text.primary',
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  color: theme.palette.mode === 'light' ? 'primary.dark' : 'text.primary',
                  pr: 5 // Make room for close button
                }}
              >
                Your Shortened URL:
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <MuiLink 
                  href={createdUrl?.fullShortUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  sx={{ 
                    fontWeight: 'bold', 
                    wordBreak: 'break-all',
                    color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light' 
                  }}
                >
                  {createdUrl?.fullShortUrl}
                </MuiLink>
                <Tooltip title="Copy Short URL">
                  <IconButton 
                    onClick={() => createdUrl && handleCopyToClipboard(createdUrl.fullShortUrl)} 
                    size="small" 
                    sx={{ color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light' }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open Short URL">
                  <IconButton 
                    component="a" 
                    href={createdUrl?.fullShortUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    size="small" 
                    sx={{ color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light' }}
                  >
                    <OpenInNewIcon fontSize="small"/>
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  mt: 1, 
                  wordBreak: 'break-all', 
                  color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light'
                }}
              >
                Original: {createdUrl?.longUrl}
              </Typography>
              
              {/* Auto-hide indicator */}
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute',
                  bottom: 8,
                  right: 12,
                  color: theme.palette.mode === 'light' ? 'primary.main' : 'text.disabled',
                  opacity: 0.7
                }}
              >
                Auto-hiding in {Math.ceil(progress / 10)}s
              </Typography>
            </Paper>
          </Fade>
        </Collapse>

        {/* Anonymous Links Section */}
        {isInitialAuthChecked && !authenticatedUser && anonymousLinks.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, textAlign: 'left' }}>
              Recently Shortened URLs
            </Typography>
            <TableContainer component={Paper} elevation={1} sx={{
              border: 1, 
              borderColor: 'divider', 
              borderRadius: '12px',
            }}>
              <Table sx={{ minWidth: 650 }} aria-label="recently shortened urls">
                <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'medium', width: '40%' }}>Original URL</TableCell>
                    <TableCell sx={{ fontWeight: 'medium', width: '35%' }}>Shortened URL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium', width: '25%', pr: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {anonymousLinks.map((link) => (
                    <TableRow
                      key={link.shortId}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: theme.palette.action.hover } }}
                    >
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          wordBreak: 'break-all', 
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={link.longUrl}
                      >
                        {link.longUrl}
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>
                        <MuiLink 
                          href={link.fullShortUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          sx={{ fontWeight: 'medium', color: 'primary.main' }}
                        >
                          {link.fullShortUrl}
                        </MuiLink>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', pr:1 }}>
                        <Tooltip title="Copy Short URL">
                          <IconButton size="small" onClick={() => handleCopyToClipboard(link.fullShortUrl)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Short URL">
                          <IconButton 
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Container>
    </Box>
  );
}