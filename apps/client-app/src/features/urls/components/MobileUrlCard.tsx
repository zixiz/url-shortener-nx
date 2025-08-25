import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Tooltip,
  Chip,
  useTheme
} from '@mui/material';
import { Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface MobileUrlCardProps {
  url: {
    id?: string;
    shortId: string;
    longUrl: string;
    fullShortUrl: string;
    clickCount?: number;
    createdAt?: string | number;
  };
  onDelete?: () => void;
  showStats?: boolean;
}

export default function MobileUrlCard({ url, onDelete, showStats = false }: MobileUrlCardProps) {
  const theme = useTheme();
  const copyToClipboard = useCopyToClipboard();

  return (
    <Card 
      elevation={1} 
      sx={{ 
        mb: 2, 
        border: 1, 
        borderColor: 'divider',
        '&:hover': {
          boxShadow: theme.shadows[4],
          borderColor: 'primary.main'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Original URL */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 1,
            wordBreak: 'break-all',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}
        >
          {url.longUrl}
        </Typography>

        {/* Shortened URL */}
        <Box sx={{ mb: 1, textAlign: 'center' }}>
          <MuiLink 
            href={url.fullShortUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            sx={{ 
              fontWeight: 'medium', 
              color: 'primary.main',
              fontSize: '0.9rem',
              wordBreak: 'break-all',
              display: 'block'
            }}
          >
            {url.fullShortUrl}
          </MuiLink>
        </Box>

        {/* Stats and Actions Row */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: showStats ? 'space-between' : 'center', 
          alignItems: 'center',
          mt: 1
        }}>
          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {showStats && url.clickCount !== undefined && (
              <Chip 
                label={`${url.clickCount} clicks`}
                size="small"
                variant="outlined"
                component={RouterLink}
                to={`/stats?id=${url.shortId}`}
                sx={{ 
                  textDecoration: 'none',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText'
                  }
                }}
              />
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Copy Short URL">
              <IconButton 
                size="small" 
                onClick={() => copyToClipboard(url.fullShortUrl, 'Short URL copied to clipboard!')}
                sx={{ color: 'primary.main' }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Open Original URL">
              <IconButton
                size="small"
                component="a"
                href={url.longUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'primary.main' }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {onDelete && (
              <Tooltip title="Delete URL">
                <IconButton 
                  size="small" 
                  onClick={onDelete}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
