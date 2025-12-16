import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';
import { IBtn } from '@/types';

const Btn = ({ title, className, onClick, ...props }: IBtn & Omit<ButtonProps, 'children'>) => {
  return (
    <Button variant="contained" color="primary" onClick={onClick} className={className} {...props}>
      {title}
    </Button>
  );
};

export default Btn;
