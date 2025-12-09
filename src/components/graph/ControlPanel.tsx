'use client';

import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Rewind,
  FastForward,
} from 'lucide-react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Button,
  ButtonGroup,
  Tooltip,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { play, pause, nextStep, prevStep, setSpeed, setIndex } from '@/shared/store';

/**
 * Компонент панели управления воспроизведением алгоритма
 */
export function ControlPanel() {
  const dispatch = useAppDispatch();
  const { currentIndex, totalSteps, playing, speedMs } = useAppSelector((state) => state.steps);

  const handlePlay = () => {
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
  };

  const progress = totalSteps > 0 
    ? ((currentIndex + 1) / totalSteps) * 100 
    : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
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
          bgcolor: 'rgba(115, 115, 115, 0.3)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 1,
            bgcolor: 'primary.main',
          },
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Tooltip title="В начало">
          <span>
            <IconButton
              onClick={handleReset}
              disabled={currentIndex === -1}
              sx={{ color: 'text.secondary' }}
            >
              <Rewind size={20} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Предыдущий шаг">
          <span>
            <IconButton
              onClick={handlePrev}
              disabled={currentIndex === -1}
              sx={{ color: 'text.secondary' }}
            >
              <SkipBack size={20} />
            </IconButton>
          </span>
        </Tooltip>

        {playing ? (
          <IconButton
            onClick={handlePause}
            color="primary"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <Pause size={24} fill="white" />
          </IconButton>
        ) : (
          <IconButton
            onClick={handlePlay}
            disabled={totalSteps === 0}
            color="primary"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <Play size={24} fill="white" />
          </IconButton>
        )}

        <Tooltip title="Следующий шаг">
          <span>
            <IconButton
              onClick={handleNext}
              disabled={currentIndex >= totalSteps - 1}
              sx={{ color: 'text.secondary' }}
            >
              <SkipForward size={20} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="В конец">
          <span>
            <IconButton
              onClick={() => {
                dispatch(setIndex(totalSteps - 1));
              }}
              disabled={currentIndex >= totalSteps - 1}
              sx={{ color: 'text.secondary' }}
            >
              <FastForward size={20} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Скорость: {speedMs}ms
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          {[2000, 1000, 500, 250].map((speed) => (
            <Button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              variant={speedMs === speed ? 'contained' : 'outlined'}
              sx={{
                minWidth: 60,
                textTransform: 'none',
              }}
            >
              {speed === 2000 ? '0.5x' : speed === 1000 ? '1x' : speed === 500 ? '2x' : '4x'}
            </Button>
          ))}
        </ButtonGroup>
      </Box>
    </Box>
  );
}

