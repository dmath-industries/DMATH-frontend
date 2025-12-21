'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, IconButton, Dialog, DialogContent, Typography, Button, Stack } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const STORAGE_KEY = 'dmath-hints-completed';

export interface Hint {
  id: string;
  selector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface HintSystemProps {
  hints: Hint[];
  storageKey?: string;
  onComplete?: () => void;
}

/**
 * Система подсказок для первого использования приложения
 * Показывает кнопку с восклицательным знаком, при нажатии выделяет элементы и затемняет остальное
 */
export function HintSystem({ hints, storageKey = STORAGE_KEY, onComplete }: HintSystemProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [hintsCompleted, setHintsCompleted] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Проверяем, были ли подсказки уже показаны
    const completed = localStorage.getItem(storageKey) === 'true';
    setHintsCompleted(completed);
  }, [storageKey]);

  const getElementPosition = useCallback((selector: string) => {
    const element = document.querySelector(selector);
    if (!element) return null;

    const rect = element.getBoundingClientRect();

    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      element,
    };
  }, []);

  const updateHighlight = useCallback(() => {
    if (!isActive || currentHintIndex >= hints.length) return;

    const currentHint = hints[currentHintIndex];
    const position = getElementPosition(currentHint.selector);

    if (!position) {
      setHighlightPosition(null);
      return;
    }

    setHighlightPosition({
      top: position.top,
      left: position.left,
      width: position.width,
      height: position.height,
    });
  }, [isActive, currentHintIndex, hints, getElementPosition]);

  useEffect(() => {
    if (isActive) {
      // Небольшая задержка для рендеринга
      const timer = setTimeout(() => {
        updateHighlight();
      }, 100);

      const handleResize = () => {
        setTimeout(() => updateHighlight(), 50);
      };
      const handleScroll = () => {
        setTimeout(() => updateHighlight(), 50);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isActive, updateHighlight]);

  useEffect(() => {
    if (isActive) {
      updateHighlight();
    }
  }, [currentHintIndex, isActive, updateHighlight]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentHintIndex(0);
  };

  const handleClose = () => {
    setIsActive(false);
    setCurrentHintIndex(0);
    setHighlightPosition(null);
  };

  const handleNext = () => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentHintIndex > 0) {
      setCurrentHintIndex(currentHintIndex - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setHintsCompleted(true);
    setIsActive(false);
    setCurrentHintIndex(0);
    setHighlightPosition(null);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (hints.length === 0) return null;

  const currentHint = hints[currentHintIndex];

  // Вычисляем позицию для диалога
  const dialogPosition = highlightPosition
    ? {
        top: Math.min(
          highlightPosition.top + highlightPosition.height + 16,
          window.innerHeight - 200
        ),
        left: Math.max(16, Math.min(highlightPosition.left, window.innerWidth - 400)),
      }
    : null;

  return (
    <>
      {/* Кнопка подсказок */}
      <IconButton
        onClick={handleStart}
        disabled={isActive}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          bgcolor: 'primary.main',
          color: 'white',
          width: 56,
          height: 56,
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
          '&:hover': {
            bgcolor: 'primary.dark',
            boxShadow: '0 6px 24px rgba(59, 130, 246, 0.6)',
            transform: 'scale(1.05)',
          },
          '&:disabled': {
            bgcolor: 'action.disabledBackground',
            color: 'action.disabled',
          },
          transition: 'all 0.2s ease',
        }}
        title="Показать подсказки"
      >
        <HelpOutlineIcon />
      </IconButton>

      {/* Оверлей с затемнением */}
      {isActive && highlightPosition && (
        <>
          {/* Затемнение сверху */}
          {highlightPosition.top > 0 && (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: `${highlightPosition.top}px`,
                bgcolor: 'rgba(0, 0, 0, 0.75)',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Затемнение слева */}
          {highlightPosition.left > 0 && (
            <Box
              sx={{
                position: 'fixed',
                top: highlightPosition.top,
                left: 0,
                width: `${highlightPosition.left}px`,
                height: `${highlightPosition.height}px`,
                bgcolor: 'rgba(0, 0, 0, 0.75)',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Затемнение справа */}
          {highlightPosition.left + highlightPosition.width < window.innerWidth && (
            <Box
              sx={{
                position: 'fixed',
                top: highlightPosition.top,
                left: highlightPosition.left + highlightPosition.width,
                right: 0,
                height: `${highlightPosition.height}px`,
                bgcolor: 'rgba(0, 0, 0, 0.75)',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Затемнение снизу */}
          {highlightPosition.top + highlightPosition.height < window.innerHeight && (
            <Box
              sx={{
                position: 'fixed',
                top: highlightPosition.top + highlightPosition.height,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.75)',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Рамка подсветки */}
          <Box
            ref={highlightRef}
            sx={{
              position: 'fixed',
              top: `${highlightPosition.top}px`,
              left: `${highlightPosition.left}px`,
              width: `${highlightPosition.width}px`,
              height: `${highlightPosition.height}px`,
              border: '3px solid #3b82f6',
              borderRadius: 2,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.2)',
              pointerEvents: 'none',
              zIndex: 1001,
              transition: 'all 0.3s ease',
            }}
          />

          {/* Панель с описанием */}
          {currentHint && (
            <Dialog
              open={isActive}
              onClose={handleClose}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  position: 'fixed',
                  top: dialogPosition ? `${dialogPosition.top}px` : '50%',
                  left: dialogPosition ? `${dialogPosition.left}px` : '50%',
                  right: dialogPosition ? 'auto' : undefined,
                  bottom: dialogPosition ? 'auto' : undefined,
                  transform: dialogPosition ? 'none' : 'translate(-50%, -50%)',
                  margin: 0,
                  maxWidth: 400,
                  backgroundColor: 'rgba(42, 42, 42, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  zIndex: 1002,
                },
              }}
              sx={{
                '& .MuiBackdrop-root': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <DialogContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {currentHint.title}
                    </Typography>
                    <IconButton size="small" onClick={handleClose} sx={{ color: 'text.secondary' }}>
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {currentHint.description}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {currentHintIndex + 1} из {hints.length}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={handlePrev}
                        disabled={currentHintIndex === 0}
                        startIcon={<ArrowBackIcon />}
                        sx={{ textTransform: 'none' }}
                      >
                        Назад
                      </Button>
                      {currentHintIndex < hints.length - 1 ? (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleNext}
                          endIcon={<ArrowForwardIcon />}
                          sx={{ textTransform: 'none' }}
                        >
                          Далее
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleComplete}
                          sx={{ textTransform: 'none' }}
                        >
                          Завершить
                        </Button>
                      )}
                    </Stack>
                  </Box>

                  <Button
                    size="small"
                    onClick={handleSkip}
                    sx={{
                      textTransform: 'none',
                      color: 'text.secondary',
                      alignSelf: 'flex-start',
                    }}
                  >
                    Пропустить все
                  </Button>
                </Stack>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </>
  );
}
