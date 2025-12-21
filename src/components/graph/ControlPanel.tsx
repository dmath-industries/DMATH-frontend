'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemText,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import FastForwardIcon from '@mui/icons-material/FastForward';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { play, pause, nextStep, prevStep, setSpeed, setIndex } from '@/shared/store';

interface ControlPanelProps {
  compact?: boolean;
}

/**
 * Компонент панели управления воспроизведением алгоритма
 */
export function ControlPanel({ compact = false }: ControlPanelProps) {
  const dispatch = useAppDispatch();
  const { currentIndex, totalSteps, playing, speedMs } = useAppSelector(state => state.steps);
  const [speedMenuAnchor, setSpeedMenuAnchor] = useState<null | HTMLElement>(null);

  const handlePlay = () => {
    if (currentIndex >= totalSteps - 1 && totalSteps > 0) {
      dispatch(setIndex(-1));
    }
    dispatch(play());
  };

  const handlePause = () => {
    dispatch(pause());
  };

  const handleNext = () => {
    dispatch(nextStep());
  };

  const handlePrev = () => {
    dispatch(prevStep());
  };

  const handleReset = () => {
    dispatch(setIndex(-1));
    dispatch(pause());
  };

  const handleSpeedChange = (speed: number) => {
    dispatch(setSpeed(speed));
    setSpeedMenuAnchor(null);
  };

  const handleSpeedMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSpeedMenuAnchor(event.currentTarget);
  };

  const handleSpeedMenuClose = () => {
    setSpeedMenuAnchor(null);
  };

  const progress = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;

  const speedOptions = [
    { value: 4000, label: '0.25x' },
    { value: 2000, label: '0.5x' },
    { value: 1000, label: '1x' },
    { value: 500, label: '2x' },
    { value: 250, label: '4x' },
  ];

  const currentSpeedLabel = speedOptions.find(opt => opt.value === speedMs)?.label || '1x';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.5 : 3 }}>
      {!compact && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Управление воспроизведением
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {currentIndex === -1 ? 'Начало' : `Шаг ${currentIndex + 1} / ${totalSteps}`}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: 'action.disabledBackground',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main',
              },
            }}
          />
        </>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? 0.5 : 1,
        }}
      >
        {compact && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              mr: 1,
              minWidth: '80px',
            }}
          >
            {currentIndex === -1 ? 'Начало' : `${currentIndex + 1}/${totalSteps}`}
          </Typography>
        )}
        <IconButton
          onClick={handleReset}
          disabled={currentIndex === -1}
          title="В начало"
          sx={{
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <FastRewindIcon />
        </IconButton>

        <IconButton
          onClick={handlePrev}
          disabled={currentIndex === -1}
          title="Предыдущий шаг"
          sx={{
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <SkipPreviousIcon />
        </IconButton>

        {playing ? (
          <IconButton
            onClick={handlePause}
            title="Пауза"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <PauseIcon />
          </IconButton>
        ) : (
          <IconButton
            onClick={handlePlay}
            disabled={totalSteps === 0}
            title="Воспроизвести"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              },
            }}
          >
            <PlayArrowIcon />
          </IconButton>
        )}

        <IconButton
          onClick={handleNext}
          disabled={currentIndex >= totalSteps - 1}
          title="Следующий шаг"
          sx={{
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <SkipNextIcon />
        </IconButton>

        <IconButton
          onClick={() => {
            dispatch(setIndex(totalSteps - 1));
          }}
          disabled={currentIndex >= totalSteps - 1}
          title="В конец"
          sx={{
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <FastForwardIcon />
        </IconButton>

        <IconButton
          onClick={handleSpeedMenuOpen}
          title={`Скорость: ${currentSpeedLabel}`}
          sx={{
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      <Menu
        anchorEl={speedMenuAnchor}
        open={Boolean(speedMenuAnchor)}
        onClose={handleSpeedMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(42, 42, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(115, 115, 115, 0.5)',
            minWidth: 120,
          },
        }}
      >
        {speedOptions.map(option => (
          <MenuItem
            key={option.value}
            onClick={() => handleSpeedChange(option.value)}
            selected={speedMs === option.value}
            sx={{
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              },
            }}
          >
            <ListItemText primary={option.label} />
            {speedMs === option.value && <CheckIcon sx={{ ml: 1, fontSize: 20 }} />}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
