import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useMemo } from 'react';

const NUM_PARTICLES_DESKTOP = 20;
const NUM_PARTICLES_MOBILE = 10;

export default function AnimatedBackground() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  // Stable particle positions to avoid reflow on re-render
  const particles = useMemo(() => {
    const count = isMdUp ? NUM_PARTICLES_DESKTOP : NUM_PARTICLES_MOBILE;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2.4 + Math.random() * 1.6,
    }));
  }, [isMdUp]);

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        willChange: 'opacity, transform',
        transform: 'translate3d(0,0,0)'
      }}
    >
      {/* Gradient orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: -160, right: -160,
          width: { xs: 256, md: 320 }, height: { xs: 256, md: 320 },
          borderRadius: '50%',
          filter: 'blur(24px)',
          opacity: isDark ? 0.16 : 0.24,
          animation: 'pulse 5s ease-in-out infinite',
          background: isDark
            ? 'linear-gradient(90deg, #a855f7, #3b82f6)'
            : 'linear-gradient(90deg, #93c5fd, #c4b5fd)',
          mixBlendMode: isDark ? 'normal' : 'multiply',
          willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -160, left: -160,
          width: { xs: 224, md: 288 }, height: { xs: 224, md: 288 },
          borderRadius: '50%',
          filter: 'blur(24px)',
          opacity: isDark ? 0.12 : 0.2,
          animation: 'pulse 6.5s ease-in-out infinite',
          animationDelay: '1s',
          background: isDark
            ? 'linear-gradient(90deg, #22d3ee, #14b8a6)'
            : 'linear-gradient(90deg, #7dd3fc, #99f6e4)',
          mixBlendMode: isDark ? 'normal' : 'multiply',
          willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)'
        }}
      />

      {/* Geometric outlines */}
      <Box sx={{
        position: 'absolute', top: 80, left: 80, width: 128, height: 128,
        opacity: isDark ? 0.06 : 0.12, transform: 'rotate(45deg)',
        border: `2px solid ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(59,130,246,0.35)'}`
      }} />
      <Box sx={{
        position: 'absolute', bottom: 128, right: 128, width: 96, height: 96,
        opacity: isDark ? 0.06 : 0.12, borderRadius: '50%',
        border: `2px solid ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(124,58,237,0.35)'}`
      }} />

      {/* Dotted grid + soft lines */}
      {isMdUp && (
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: isDark ? 0.08 : 0.12 }}>
        <defs>
          <pattern id="gridDots" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="1" fill={isDark ? '#ffffff' : '#000000'} opacity={isDark ? 0.35 : 0.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridDots)" />
        <path d="M100,100 Q200,50 300,100 T500,100" stroke={isDark ? '#4f46e5' : '#6366f1'} strokeWidth="1" fill="none" opacity="0.25" />
      </svg>
      )}

      {/* Floating micro-particles */}
      {particles.map(p => (
        <Box
          key={p.id}
          sx={{
            position: 'absolute',
            width: 4, height: 4, borderRadius: '50%',
            backgroundColor: isDark 
            ? 'rgba(156,163,175,0.35)' 
            : 'rgba(168,85,247,0.3)',
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            willChange: 'transform, opacity',
            transform: 'translate3d(0,0,0)'
          }}
        />
      ))}


      <style>
        {`
          @media (prefers-reduced-motion: reduce) {
            .reduce-motion * { animation: none !important; transition: none !important; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); opacity: 0.7; }
            50% { transform: translateY(-6px); opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
}
