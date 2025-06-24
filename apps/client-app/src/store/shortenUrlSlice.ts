import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CreatedUrlResponse {
  id: string;
  shortId: string;
  longUrl: string;
  fullShortUrl: string;
  userId?: string | null;
}

interface ShortenUrlState {
  createdUrl: CreatedUrlResponse | null;
  showCreatedUrl: boolean;
  shortenTimestamps: number[];
  isRateLimited: boolean;
  formError: string | null;
}

const initialState: ShortenUrlState = {
  createdUrl: null,
  showCreatedUrl: false,
  shortenTimestamps: [],
  isRateLimited: false,
  formError: null,
};

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 5000;

const shortenUrlSlice = createSlice({
  name: 'shortenUrl',
  initialState,
  reducers: {
    createShortUrlRequest(state) {
      state.formError = null;
    },
    createShortUrlSuccess(state, action: PayloadAction<CreatedUrlResponse>) {
      state.createdUrl = action.payload;
      state.showCreatedUrl = true;
      state.formError = null;
    },
    createShortUrlFailure(state, action: PayloadAction<string>) {
      state.formError = action.payload;
    },
    hideCreatedUrl(state) {
      state.showCreatedUrl = false;
      state.createdUrl = null;
    },
    updateShortenTimestamps(state, action: PayloadAction<number>) {
      const now = action.payload;
      const recentTimestamps = state.shortenTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
      if (recentTimestamps.length >= RATE_LIMIT_COUNT) {
        state.isRateLimited = true;
        state.formError = 'You are creating URLs too quickly. Please wait a few seconds.';
      } else {
        state.isRateLimited = false;
        state.formError = null;
        state.shortenTimestamps = [...recentTimestamps, now];
      }
    },
    clearRateLimit(state) {
      state.isRateLimited = false;
      state.formError = null;
    },
  },
});

export const {
  createShortUrlRequest,
  createShortUrlSuccess,
  createShortUrlFailure,
  hideCreatedUrl,
  updateShortenTimestamps,
  clearRateLimit,
} = shortenUrlSlice.actions;

export default shortenUrlSlice.reducer; 