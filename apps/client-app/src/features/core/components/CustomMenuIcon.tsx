import SvgIcon from '@mui/material/SvgIcon';

export default function CustomMenuIcon() {
  return (
    <SvgIcon 
        viewBox="0 0 24 24" 
        sx={{ 
        fontSize: 24,
        color: (theme) => theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
        }}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"/>
        <path 
          d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"/>
    </SvgIcon>
  );
}
