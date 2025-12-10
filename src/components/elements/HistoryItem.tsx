import { Card, CardContent, Typography, Box, Button, IconButton } from '@mui/material';
import { Trash2, ExternalLink } from 'lucide-react';
import type { IHistory } from '@/types';

interface HistoryItemProps extends IHistory {
  onOpen?: () => void;
  onDelete?: () => void;
}

const HistoryItem = ({ title, date, onOpen, onDelete }: HistoryItemProps) => {
  return (
    <Card
      sx={{
        bgcolor: '#B5B5B5',
        color: 'text.primary',
        '&:hover': {
          bgcolor: '#C5C5C5',
          boxShadow: 2,
        },
        transition: 'all 0.2s ease',
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1, sm: 2 },
            flex: 1,
            width: '100%',
          }}
        >
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem', lg: '1.5rem' },
              fontWeight: 500,
              textAlign: { xs: 'center', sm: 'left' },
              wordBreak: 'break-word',
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' },
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              textAlign: { xs: 'center', sm: 'right' },
            }}
          >
            {date}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'center', sm: 'flex-end' },
          }}
        >
          {onOpen && (
            <Button
              variant="contained"
              color="primary"
              onClick={onOpen}
              startIcon={<ExternalLink size={16} />}
              sx={{
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              Открыть
            </Button>
          )}
          {onOpen && (
            <IconButton
              color="primary"
              onClick={onOpen}
              sx={{
                display: { xs: 'flex', sm: 'none' },
              }}
              title="Открыть"
            >
              <ExternalLink size={16} />
            </IconButton>
          )}
          
          {onDelete && (
            <Button
              variant="contained"
              color="error"
              onClick={onDelete}
              startIcon={<Trash2 size={16} />}
              sx={{
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              Удалить
            </Button>
          )}
          {onDelete && (
            <IconButton
              color="error"
              onClick={onDelete}
              sx={{
                display: { xs: 'flex', sm: 'none' },
              }}
              title="Удалить"
            >
              <Trash2 size={16} />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HistoryItem;

