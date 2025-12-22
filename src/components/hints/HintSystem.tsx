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
  const [dialogPosition, setDialogPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const updatePositions = useCallback(() => {
    if (!isActive || currentHintIndex >= hints.length) return;

    const currentHint = hints[currentHintIndex];
    const position = getElementPosition(currentHint.selector);

    if (!position) {
      setHighlightPosition(null);
      setDialogPosition(null);
      return;
    }

    setHighlightPosition({
      top: position.top,
      left: position.left,
      width: position.width,
      height: position.height,
    });

    const dialogWidth = 400;
    const dialogHeight = 250;
    const padding = 16;

    let dialogTop: number;
    let dialogLeft: number;

    if (currentHint.position === 'right') {
      dialogLeft = position.left + position.width + padding;
      dialogTop = position.top;

      if (dialogLeft + dialogWidth > window.innerWidth - padding) {
        dialogLeft = position.left - dialogWidth - padding;
      }

      if (dialogLeft < padding) {
        dialogLeft = window.innerWidth - dialogWidth - padding;
      }

      if (dialogTop + dialogHeight > window.innerHeight - padding) {
        dialogTop = window.innerHeight - dialogHeight - padding;
      }

      if (dialogTop < padding) {
        dialogTop = padding;
      }
    } else if (currentHint.position === 'left') {
      dialogLeft = position.left - dialogWidth - padding;
      dialogTop = position.top;

      if (dialogLeft < padding) {
        dialogLeft = position.left + position.width + padding;
      }

      if (dialogLeft + dialogWidth > window.innerWidth - padding) {
        dialogLeft = padding;
      }

      if (dialogTop + dialogHeight > window.innerHeight - padding) {
        dialogTop = window.innerHeight - dialogHeight - padding;
      }

      if (dialogTop < padding) {
        dialogTop = padding;
      }
    } else {
      dialogTop = position.top + position.height + padding;
      dialogLeft = Math.max(
        padding,
        Math.min(position.left, window.innerWidth - dialogWidth - padding)
      );

      if (dialogTop + dialogHeight > window.innerHeight - padding) {
        dialogTop = Math.max(padding, position.top - dialogHeight - padding);
      }

      if (dialogLeft + dialogWidth > window.innerWidth - padding) {
        dialogLeft = window.innerWidth - dialogWidth - padding;
      }

      if (dialogLeft < padding) {
        dialogLeft = padding;
      }
    }

    setDialogPosition({
      top: dialogTop,
      left: dialogLeft,
    });
  }, [isActive, currentHintIndex, hints, getElementPosition]);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        updatePositions();
      }, 100);

      const handleScroll = () => {
        updatePositions();
      };

      const handleResize = () => {
        requestAnimationFrame(() => {
          updatePositions();
        });
      };

      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll, { capture: true });
        document.removeEventListener('scroll', handleScroll, { capture: true });
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isActive, updatePositions]);

  useEffect(() => {
    if (isActive) {
      updatePositions();
    }
  }, [currentHintIndex, isActive, updatePositions]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentHintIndex(0);
  };

  const handleClose = () => {
    setIsActive(false);
    setCurrentHintIndex(0);
    setHighlightPosition(null);
    setDialogPosition(null);
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
    setDialogPosition(null);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (hints.length === 0) return null;

  const currentHint = hints[currentHintIndex];

  return (
    <>
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

      {isActive && highlightPosition && (
        <>
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
              willChange: 'top, left, width, height',
            }}
          />

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
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  backgroundColor: 'rgba(42, 42, 42, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  zIndex: 1002,
                  transition: 'none',
                },
              }}
              sx={{
                '& .MuiBackdrop-root': {
                  backgroundColor: 'transparent',
                  pointerEvents: 'none',
                },
              }}
              disableScrollLock
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
