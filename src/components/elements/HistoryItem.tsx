import { IHistory } from '@/types';
import { Trash2, ExternalLink } from 'lucide-react';

interface HistoryItemProps extends IHistory {
  onOpen?: () => void;
  onDelete?: () => void;
}

const HistoryItem = ({ title, date, onOpen, onDelete }: HistoryItemProps) => {
  return (
    <div
      className="
        bg-[#B5B5B5] text-black 
        w-full px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 
        rounded-xl 
        flex flex-col sm:flex-row 
        justify-between items-start sm:items-center
        gap-3 sm:gap-4
        transition-all duration-200
        hover:bg-[#C5C5C5] hover:shadow-md
      "
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 flex-1 w-full">
        <h1
          className="
            text-base sm:text-lg md:text-xl lg:text-2xl 
            font-medium
            text-center sm:text-left
            break-words
          "
        >
          {title}
        </h1>

        <p
          className="
            text-sm sm:text-base md:text-lg lg:text-xl
            text-gray-700
            whitespace-nowrap
            text-center sm:text-right
          "
        >
          {date}
        </p>
      </div>

      <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
        {onOpen && (
          <button
            onClick={onOpen}
            className="
              flex items-center gap-2
              px-3 sm:px-4 py-2
              bg-blue-500 hover:bg-blue-600
              text-white
              rounded-lg
              transition-colors
              text-sm sm:text-base
            "
            title="Открыть"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Открыть</span>
          </button>
        )}
        
        {onDelete && (
          <button
            onClick={onDelete}
            className="
              flex items-center gap-2
              px-3 sm:px-4 py-2
              bg-red-500 hover:bg-red-600
              text-white
              rounded-lg
              transition-colors
              text-sm sm:text-base
            "
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Удалить</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default HistoryItem;

