import { useState, useEffect, useRef, FormEventHandler } from 'react';
import { useAppSelector, useAppDispatch } from '../../core/store/hooks';
import apiClient from '../../core/lib/apiClient';
import { showSnackbar } from '../../core/store/uiSlice';
import {
  createShortUrlRequest,
  createShortUrlSuccess,
  createShortUrlFailure,
  hideCreatedUrl,
  updateShortenTimestamps,
  clearRateLimit,
} from '../state/shortenUrlSlice';
import { addAnonymousLink, AnonymousLink } from './useAnonymousLinks';
import { ApiError } from '../../core/lib/apiErrorHandling';

interface CreatedUrlResponse {
  id: string;
  shortId: string;
  longUrl: string;
  fullShortUrl: string;
  userId?: string | null;
  createdAt: number;
}

const AUTO_HIDE_ERROR_DURATION = 8000;

export const useUrlShortener = (setAnonymousLinks: (links: AnonymousLink[]) => void) => {
  const dispatch = useAppDispatch();

  const [longUrl, setLongUrl] = useState('');
  const [isFormLoading, setIsFormLoading] = useState(false);

  const {
    isRateLimited,
    formError,
  } = useAppSelector((state) => state.shortenUrl);
  const { user: authenticatedUser } = useAppSelector((state) => state.auth);

  const errorHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!longUrl.trim()) {
      dispatch(createShortUrlFailure('Please enter a URL to shorten.'));
      return;
    }

    const now = Date.now();
    dispatch(updateShortenTimestamps(now));

    if (isRateLimited) {
      return;
    }

    setIsFormLoading(true);
    dispatch(createShortUrlRequest());

    try {
      const response = await apiClient.post<CreatedUrlResponse>('/urls', { longUrl });

      dispatch(createShortUrlSuccess(response.data));
      dispatch(showSnackbar({ message: 'URL Shortened Successfully!', severity: 'success', duration: 3000 }));

      if (!authenticatedUser && response.data) {
        const newLink: AnonymousLink = {
          shortId: response.data.shortId,
          longUrl: response.data.longUrl,
          fullShortUrl: response.data.fullShortUrl,
          createdAt: Date.now(),
        };

        const updatedLinks = addAnonymousLink(newLink);
        setAnonymousLinks(updatedLinks);

        if (updatedLinks.length >= 5) {
          dispatch(
            showSnackbar({
              message: 'Want to save more than 5 links? Register for a free account!',
              severity: 'info',
              duration: 6000,
            })
          );
        }
      }

      setLongUrl('');
    } catch (err: any) {
      // The error object is already standardized by apiClient's interceptor using extractError
      const apiError = err as ApiError; // Cast to ApiError for type safety
      const errorMessage = apiError.message || 'Failed to shorten URL. Please ensure it is a valid URL.';

      dispatch(createShortUrlFailure(errorMessage));
      dispatch(showSnackbar({ message: errorMessage, severity: apiError.statusCode === 429 ? 'warning' : 'error' }));
      dispatch(hideCreatedUrl());
      console.error('Error creating short URL:', err);
    } finally {
      setIsFormLoading(false);
    }
  };

  return {
    longUrl,
    setLongUrl,
    isFormLoading,
    handleSubmit,
    isRateLimited,
    formError,
  };
};
