import PageHero from '../components/PageHero';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import UrlActions from '../components/UrlActions';
import LoadingIndicator from '../../core/components/LoadingIndicator';
import { useState, FormEvent, useEffect, useRef } from 'react';
import {
  Container, Box, Typography, Paper,
  IconButton, Link as MuiLink, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, Fade, LinearProgress, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAppSelector, useAppDispatch } from '../../core/store/hooks.js'; 
import apiClient from '../../core/lib/apiClient.js';
import { showSnackbar } from '../../core/store/snackbarSlice';
import { useThemeMode } from '../../theme/components/ViteThemeRegistry.js';
import { useTheme } from '@mui/material/styles';
import {
  createShortUrlRequest,
  createShortUrlSuccess,
  createShortUrlFailure,
  hideCreatedUrl,
  updateShortenTimestamps,
  clearRateLimit,
} from '../state/shortenUrlSlice.js';

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
const AUTO_HIDE_ERROR_DURATION = 8000;

// Image URL from the Stitch example 


export default function HomePage() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const copyToClipboard = useCopyToClipboard();
  
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
  
  const { mode } = useThemeMode(); 
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto-hide effect for error messages
  useEffect(() => {
    if (formError) {
      if (errorHideTimeoutRef.current) clearTimeout(errorHideTimeoutRef.current);
      errorHideTimeoutRef.current = setTimeout(() => {
        dispatch(createShortUrlFailure(''));
      }, AUTO_HIDE_ERROR_DURATION);
    }
    return () => {
      if (errorHideTimeoutRef.current) clearTimeout(errorHideTimeoutRef.current);
    };
  }, [formError, dispatch]);

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
      dispatch(showSnackbar({ message: 'URL Shortened Successfully!', severity: 'success', duration: 3000 }));

      // Handle anonymous links storage
      if (!authenticatedUser && response.data) {
        const newLink: AnonymousLink = {
          shortId: response.data.shortId,
          longUrl: response.data.longUrl,
          fullShortUrl: response.data.fullShortUrl,
          createdAt: Date.now(),
        };
        
        const updatedLinks = [newLink, ...anonymousLinks].slice(0, MAX_ANONYMOUS_LINKS);
        setAnonymousLinks(updatedLinks);

        if (typeof window !== 'undefined') {
          localStorage.setItem(ANONYMOUS_LINKS_STORAGE_KEY, JSON.stringify(updatedLinks));
        }

        if (updatedLinks.length >= MAX_ANONYMOUS_LINKS) {
          dispatch(showSnackbar({ 
            message: 'Want to save more than 5 links? Register for a free account!',
            severity: 'info',
            duration: 6000 
          }));
        }
      }
      
      setLongUrl(''); 
    } catch (err: any) {
      let errorMessage = 'Failed to shorten URL. Please ensure it is a valid URL.';
      if (err.response?.status === 429) {
        errorMessage = 'Too many requests, please try again later.';
        dispatch(showSnackbar({ message: errorMessage, severity: 'warning' }));
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      dispatch(createShortUrlFailure(errorMessage));
      dispatch(hideCreatedUrl());
      console.error("Error creating short URL:", err);
    } finally {
      setIsFormLoading(false);
    }
  };

  
  
  // Cleanup feedback and error state when HomePage unmounts
  useEffect(() => {
    return () => {
      dispatch(hideCreatedUrl());
      dispatch(createShortUrlFailure(''));
    };
  }, [dispatch]);

  if (!isInitialAuthChecked) {
    return <LoadingIndicator height="calc(100vh - 200px)" />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{pt: {xs: 0, md: 0}, pb: 4, px: {xs: 0, sm: 2} }}>
        
        <PageHero
          longUrl={longUrl}
          setLongUrl={setLongUrl}
          handleSubmit={handleSubmit}
          isFormLoading={isFormLoading}
          isRateLimited={isRateLimited}
          formError={formError}
          mode={mode}
        />

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
                    onClick={() => createdUrl && copyToClipboard(createdUrl.fullShortUrl, 'Short URL copied to clipboard!')} 
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
                          <UrlActions url={link} />
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