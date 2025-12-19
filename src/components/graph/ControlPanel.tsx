'use client';

import { Box, Typography, IconButton, LinearProgress, Button, ButtonGroup } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import FastForwardIcon from '@mui/icons-material/FastForward';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { play, pause, nextStep, prevStep, setSpeed, setIndex } from '@/shared/store';

/**
 * Компонент панели управления воспроизведением алгоритма
 */
export function ControlPanel() {
  const dispatch = useAppDispatch();
  const { currentIndex, totalSteps, playing, speedMs } = useAppSelector(state => state.steps);

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
  };

  const progress = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;

  const speedLabels: Record<number, string> = {
    4000: '0.25x',
    2000: '0.5x',
    1000: '1x',
    500: '2x',
    250: '4x',
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
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
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ButtonGroup variant="outlined" size="small" fullWidth>
          {[4000, 2000, 1000, 500, 250].map(speed => (
            <Button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              variant={speedMs === speed ? 'contained' : 'outlined'}
              sx={{
                flex: 1,
              }}
            >
              {speedLabels[speed]}
            </Button>
          ))}
        </ButtonGroup>
      </Box>
    </Box>
  );
}
