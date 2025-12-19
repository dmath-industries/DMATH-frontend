import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

interface GraphMatrixInputProps {
  onSubmit: (matrix: string) => void;
  placeholder?: string;
  defaultValue?: string;
  exampleMatrix?: string;
  onLoadExample?: () => void;
}

export function GraphMatrixInput({
  onSubmit,
  placeholder,
  defaultValue,
  exampleMatrix,
  onLoadExample,
}: GraphMatrixInputProps) {
  const [matrixText, setMatrixText] = useState(
    defaultValue || exampleMatrix || '0,1,0,1,0\n1,0,1,1,0\n0,1,0,0,1\n1,1,0,0,1\n0,0,1,1,0'
  );

  const handleSubmit = () => {
    onSubmit(matrixText);
  };

  const handleLoadExample = () => {
    if (exampleMatrix) {
      setMatrixText(exampleMatrix);
      if (onLoadExample) {
        onLoadExample();
      }
    }
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
      <Box sx={{ display: 'flex', gap: 2 }}>
        {exampleMatrix && (
          <Button
            variant="outlined"
            onClick={handleLoadExample}
            sx={{
              flex: 1,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.light',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
              },
            }}
          >
            Загрузить пример
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            flex: 1,
            background: 'linear-gradient(to right, #9333ea, #a855f7)',
            '&:hover': {
              background: 'linear-gradient(to right, #a855f7, #c084fc)',
            },
          }}
        >
          Отправить
        </Button>
      </Box>
    </Box>
  );
}
