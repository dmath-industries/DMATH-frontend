import { Button } from '@mui/material';
import type { IBtn } from '@/types';

const Btn = ({ title, className, onClick }: IBtn) => {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      className={className}
      sx={{
        background: 'linear-gradient(90deg, #9333ea 0%, #3b82f6 100%)',
        boxShadow: '0 4px 14px rgba(147, 51, 234, 0.2)',
        transform: 'scale(1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'linear-gradient(90deg, #7e22ce 0%, #2563eb 100%)',
          boxShadow: '0 6px 20px rgba(147, 51, 234, 0.4)',
          transform: 'scale(1.02)',
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      {title}
    </Button>
  );
};

export default Btn;

