import { IBtn } from '@/types';
import { cn } from '@/shared/lib/utils';

const Btn = ({ title, className, onClick }: IBtn) => {
  return (
    <button className={cn('btn-primary', className)} onClick={onClick}>
      {title}
    </button>
  );
};

export default Btn;

