import { Typography, Container, Button, Box, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NOT_FOUND_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuDNY_7_Zb6W6D9RJsBPJnyuwSun46lZ2DjDhmFUmBAMQA0KRdNiTfBnG-h7yfOaT_Ivd-zVvGnuvZmVXRgdRDfNWOq2t5ololt704wdC7vT0Tskq0no5t5m-V301-SuwbrkztCN472ChhiqYfd8XjYCLztJiRP_q_i9Ig3ek1gBVT2JKoc3CWvoTWoqJpeWzXgd1nG33_XPuDAUIG7Ic6dmNyxD7kBNTUY1sVJ1s3lBQ_4nd9Mn96MncLoFKH-MUW-iiN_Muf0utwc";

export default function NotFoundPage() { 

  return (
    <Container 
      component="main" 
      maxWidth="md" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center',
        minHeight: 'calc(100vh - 128px)', 
        py: { xs: 3, sm: 5 } 
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: {xs: 3, sm: 6},
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          bgcolor: 'background.paper'
        }}
      >
        <Box
          component="img"
          src={NOT_FOUND_IMAGE_URL}
          alt="Page not found - broken chain"
          sx={{
            width: '90%', 
            maxWidth: '400px',
            height: 'auto',
            mb: 2, 
            borderRadius: '8px'
          }}
        />
        <Typography 
          variant="h3"
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            mb: 2
          }}
        >
          Page not found
        </Typography>
        <Typography 
          variant="h6"
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: '95%' }}
        >
          The page you are looking for does not exist. Please check the URL or go back to the homepage.
        </Typography>
        <Button 
          component={RouterLink} 
          to="/" 
          variant="contained" 
          color="primary"
          size="large"
          sx={{
            borderRadius: '999px', 
            px: 5,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Go to Homepage
        </Button>
      </Paper>
    </Container>
  ); 
}