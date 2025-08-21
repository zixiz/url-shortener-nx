
import { Box, TextField, Button, Typography, InputAdornment, CircularProgress, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { FormEvent } from 'react';

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuC5oYzQi-XEkOhBaLGMWgGitAnx3gRVoqWT098YNvzmwhSvI4AWSJnk4FymirDetf-TBGRvO0KY0l7GzLNv70NYcKLFWDSWMqMqbd8VySlbFads8r3AWJGgU7UTAKsuq_RVYD_aR-ivg69UqK2Woe79CfeW0Hlzfj52JSx-lavobiO6salvSj5OpTQ8xsJb2sNa6dbJvrMXYMFD-z5iw2Y3L8Lzn8a9OWmGWvN3hnQIpMczakixWwnEOnO1iMV1NbLD3bW_A5mE8tQ";

interface PageHeroProps {
  longUrl: string;
  setLongUrl: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isFormLoading: boolean;
  isRateLimited: boolean;
  formError: string | null;
  mode: 'light' | 'dark';
}

export default function PageHero({ longUrl, setLongUrl, handleSubmit, isFormLoading, isRateLimited, formError, mode }: PageHeroProps) {
  return (
    <>
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
          onChange={(e) => setLongUrl(e.target.value)}
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
    {formError && (<Alert severity="error" sx={{ mb: 3, mt: 2 }}>{formError}</Alert>)}
    </>
  );
}
