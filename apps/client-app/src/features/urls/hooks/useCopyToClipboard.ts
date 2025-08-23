
import { useAppDispatch } from '../../core/store/hooks';
import { showSnackbar } from '../../core/store/uiSlice';

export function useCopyToClipboard() {
  const dispatch = useAppDispatch();

  const copyToClipboard = (text: string, successMessage: string = 'Copied to clipboard!') => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => dispatch(showSnackbar({ message: successMessage, severity: 'success', duration: 3000 })))
        .catch(err => {
          console.error('Failed to copy with navigator.clipboard:', err);
          dispatch(showSnackbar({ message: 'Failed to copy.', severity: 'error' }));
        });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        dispatch(showSnackbar({ message: successMessage, severity: 'success', duration: 3000 }));
      } catch (err) {
        console.error('Fallback failed to copy to clipboard:', err);
        dispatch(showSnackbar({ message: 'Failed to copy.', severity: 'error' }));
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return copyToClipboard;
}
