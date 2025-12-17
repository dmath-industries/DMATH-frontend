import Link from 'next/link';
import Image from 'next/image';
import { IAlgorithmsItem } from '@/types';
import { AnalyticsEvents } from '@/shared/lib';
import { Box, Paper, Typography } from '@mui/material';

const AlgorithmsItem = ({ title, img, href }: IAlgorithmsItem) => {
  const getAlgorithmName = (): string => {
    if (!href) return 'unknown';
    const match = href.match(/\/algorithms\/([^/]+)/);
    return match && match[1] ? match[1] : 'unknown';
  };

  const handleClick = () => {
    AnalyticsEvents.algorithmSelected(getAlgorithmName());
  };

  return (
    <Paper
      component={Link}
      href={href || '#'}
      onClick={handleClick}
      sx={{
        position: 'relative',
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        minHeight: 380,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        textDecoration: 'none',
        background: 'linear-gradient(to bottom right, #2a2a2a, #1f1f1f, #151515)',
        border: '2px solid #3a3a3a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        px: 8,
        py: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.5s ease-out',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(139,92,246,0.3)',
          borderColor: '#6b46c1',
          background: 'linear-gradient(to bottom right, #2d1b4e, #1f1f1f, #151515)',
          '& .animated-bg': {
            background:
              'linear-gradient(to bottom right, rgba(147, 51, 234, 0.2), rgba(37, 99, 235, 0.15), rgba(6, 182, 212, 0.2))',
          },
          '& .corner-glow-purple': {
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
          },
          '& .corner-glow-blue': {
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
          '& .shine-effect': {
            opacity: 1,
            '& > div': {
              transform: 'translateX(100%)',
            },
          },
          '& .image-container': {
            borderColor: 'rgba(107, 70, 193, 0.5)',
            background: 'linear-gradient(to bottom right, #2d1b4e, #1a1a1a)',
            '& > div': {
              background:
                'linear-gradient(to bottom right, rgba(168, 85, 247, 0.05), rgba(59, 130, 246, 0.05))',
            },
          },
          '& .image': {
            transform: 'scale(1.1)',
            filter: 'brightness(1.1)',
          },
          '& .title': {
            background: 'linear-gradient(to right, #c084fc, #60a5fa, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          },
          '& .bottom-accent': {
            background: 'linear-gradient(to right, #9333ea, #3b82f6, #06b6d4)',
          },
          '& .top-accent': {
            backgroundColor: '#9333ea',
            boxShadow: '0 0 15px rgba(139,92,246,0.8)',
          },
        },
      }}
    >
      {/* Animated background gradient */}
      <Box
        className="animated-bg"
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: 4,
          background:
            'linear-gradient(to bottom right, rgba(147, 51, 234, 0), rgba(37, 99, 235, 0), rgba(6, 182, 212, 0))',
          transition: 'all 0.5s',
          pointerEvents: 'none',
        }}
      />

      {/* Corner glow effects */}
      <Box
        className="corner-glow-purple"
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 128,
          height: 128,
          backgroundColor: 'transparent',
          borderRadius: '50%',
          filter: 'blur(48px)',
          transition: 'all 0.5s',
          pointerEvents: 'none',
        }}
      />
      <Box
        className="corner-glow-blue"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 128,
          height: 128,
          backgroundColor: 'transparent',
          borderRadius: '50%',
          filter: 'blur(48px)',
          transition: 'all 0.5s',
          pointerEvents: 'none',
        }}
      />

      {/* Shine sweep effect */}
      <Box
        className="shine-effect"
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          transition: 'opacity 0.5s',
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: 4,
          '& > div': {
            position: 'absolute',
            inset: 0,
            borderRadius: 4,
            background:
              'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
            transform: 'translateX(-100%)',
            transition: 'transform 1s ease-in-out',
          },
        }}
      >
        <Box />
      </Box>

      {/* Image container */}
      <Box
        className="image-container"
        sx={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: 192,
          borderRadius: 3,
          p: 6,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
          background: 'linear-gradient(to bottom right, #2a2a2a, #1a1a1a)',
          border: '1px solid rgba(58, 58, 58, 0.5)',
          transition: 'all 0.5s',
          '& > div': {
            position: 'absolute',
            inset: 0,
            borderRadius: 3,
            background:
              'linear-gradient(to bottom right, rgba(168, 85, 247, 0), rgba(59, 130, 246, 0))',
            transition: 'all 0.5s',
          },
        }}
      >
        <Box />
        <Box
          className="image"
          component="span"
          sx={{
            position: 'relative',
            zIndex: 10,
            display: 'block',
            transition: 'all 0.5s',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
          }}
        >
          <Image
            src={img || '/images/svg/Rectangle.svg'}
            alt={title}
            width={200}
            height={200}
            style={{ objectFit: 'contain' }}
          />
        </Box>
      </Box>

      {/* Title */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          mt: 8,
        }}
      >
        <Typography
          className="title"
          variant="h5"
          sx={{
            fontSize: { xs: '1.125rem', md: '1.25rem', lg: '1.5rem' },
            textAlign: 'center',
            fontWeight: 700,
            color: '#ffffff',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.25,
            transition: 'all 0.5s',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Bottom accent bar */}
      <Box
        className="bottom-accent"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          background:
            'linear-gradient(to right, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3))',
          transition: 'all 0.5s',
        }}
      />

      {/* Top corner accent */}
      <Box
        className="top-accent"
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          transition: 'all 0.5s',
          boxShadow: '0 0 10px rgba(139,92,246,0)',
        }}
      />
    </Paper>
  );
};

export default AlgorithmsItem;
