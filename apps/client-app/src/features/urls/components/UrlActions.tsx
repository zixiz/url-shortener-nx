
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface UrlActionsProps {
  url: {
    fullShortUrl: string;
    longUrl: string;
  };
  onDelete?: () => void;
}

export default function UrlActions({ url, onDelete }: UrlActionsProps) {
  const copyToClipboard = useCopyToClipboard();

  return (
    <>
      <Tooltip title="Copy Short URL">
        <IconButton size="small" onClick={() => copyToClipboard(url.fullShortUrl, 'Short URL copied to clipboard!')}>
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
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {onDelete && (
        <Tooltip title="Delete URL">
          <IconButton size="small" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}
