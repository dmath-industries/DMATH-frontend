import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

interface GraphMatrixInputProps {
  onSubmit: (matrix: string) => void;
  placeholder?: string;
}

export function GraphMatrixInput({ onSubmit, placeholder }: GraphMatrixInputProps) {
  const [matrixText, setMatrixText] = useState('0,1,0,1,0\n1,0,1,1,0\n0,1,0,0,1\n1,1,0,0,1\n0,0,1,1,0');

  const handleSubmit = () => {
    onSubmit(matrixText);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {placeholder || 'Задайте матрицу смежности. Используйте запятую в качестве разделителя'}
      </Typography>
      <TextField
        multiline
        rows={8}
        value={matrixText}
        onChange={(e) => setMatrixText(e.target.value)}
        placeholder="0,1,0,1,0\n1,0,1,1,0\n0,1,0,0,1"
        fullWidth
        sx={{
          bgcolor: 'rgba(23, 23, 23, 0.8)',
          '& .MuiOutlinedInput-root': {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(115, 115, 115, 0.5)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(115, 115, 115, 0.7)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
          },
        }}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        fullWidth
        sx={{
          py: 1.5,
          background: 'linear-gradient(90deg, #9333ea 0%, #a855f7 100%)',
          '&:hover': {
            background: 'linear-gradient(90deg, #7e22ce 0%, #9333ea 100%)',
          },
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: '0 4px 14px rgba(147, 51, 234, 0.2)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(147, 51, 234, 0.4)',
          },
        }}
      >
        Отправить
      </Button>
    </Box>
  );
}

