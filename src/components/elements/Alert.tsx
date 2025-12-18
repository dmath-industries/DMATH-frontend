import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography } from '@mui/material';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

export interface AlertProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'info' | 'warning' | 'error' | 'success';
  showIcon?: boolean;
  showCloseButton?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const variantConfig = {
  info: {
    icon: Info,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  error: {
    icon: AlertCircle,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  success: {
    icon: CheckCircle,
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
  },
};

export function Alert({
  open,
  onClose,
  title,
  children,
  actions,
  variant = 'info',
  showIcon = true,
  showCloseButton = true,
  maxWidth = 'sm',
}: AlertProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2a2a2a',
          backgroundImage: 'none',
          border: '1px solid rgba(115, 115, 115, 0.3)',
          borderRadius: 2,
        },
      }}
    >
      {(title || showCloseButton) && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: children ? 2 : 3,
            position: 'relative',
          }}
        >
          {showIcon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: config.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconComponent size={20} color={config.color} />
            </Box>
          )}
          {title && (
            <Box sx={{ flex: 1 }}>
              {typeof title === 'string' ? (
                <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
                  {title}
                </Typography>
              ) : (
                title
              )}
            </Box>
          )}
          {showCloseButton && (
            <Box
              component="button"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 16,
                top: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0.5,
                borderRadius: 1,
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(115, 115, 115, 0.2)',
                  color: 'text.primary',
                },
              }}
            >
              <X size={20} />
            </Box>
          )}
        </DialogTitle>
      )}

      {children && (
        <DialogContent sx={{ pb: actions ? 2 : 3 }}>
          {typeof children === 'string' ? (
            <Typography variant="body1">{children}</Typography>
          ) : (
            children
          )}
        </DialogContent>
      )}

      {actions && (
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
