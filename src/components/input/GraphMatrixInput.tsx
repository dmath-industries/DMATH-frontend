import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

interface GraphMatrixInputProps {
  onSubmit: (matrix: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

export function GraphMatrixInput({ onSubmit, placeholder, defaultValue }: GraphMatrixInputProps) {
  const [matrixText, setMatrixText] = useState(
    defaultValue || '0,1,0,1,0\n1,0,1,1,0\n0,1,0,0,1\n1,1,0,0,1\n0,0,1,1,0'
  );

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
        onChange={e => setMatrixText(e.target.value)}
        placeholder="0,1,0,1,0&#10;1,0,1,1,0&#10;0,1,0,0,1"
        sx={{
          '& .MuiOutlinedInput-root': {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          },
        }}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        fullWidth
        sx={{
          background: 'linear-gradient(to right, #9333ea, #a855f7)',
          '&:hover': {
            background: 'linear-gradient(to right, #a855f7, #c084fc)',
          },
        }}
      >
        Отправить
      </Button>
    </Box>
  );
}
