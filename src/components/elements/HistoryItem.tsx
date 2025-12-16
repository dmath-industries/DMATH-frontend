import { IHistory } from '@/types';
import { Trash2, ExternalLink } from 'lucide-react';
import { Paper, Box, Typography, Button, Stack } from '@mui/material';

interface HistoryItemProps extends IHistory {
  onOpen?: () => void;
  onDelete?: () => void;
}

const HistoryItem = ({ title, date, onOpen, onDelete }: HistoryItemProps) => {
  return (
    <Paper
      sx={{
        backgroundColor: '#B5B5B5',
        color: 'text.primary',
        width: '100%',
        px: { xs: 3, sm: 4, md: 5 },
        py: { xs: 3, sm: 4, md: 5 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 3, sm: 4 },
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: '#C5C5C5',
          boxShadow: 4,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 2, sm: 4 },
          flex: 1,
          width: '100%',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem', lg: '1.5rem' },
            fontWeight: 500,
            textAlign: { xs: 'center', sm: 'left' },
            wordBreak: 'break-word',
            color: '#000000',
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' },
            color: '#374151',
            whiteSpace: 'nowrap',
            textAlign: { xs: 'center', sm: 'right' },
          }}
        >
          {date}
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'center', sm: 'flex-end' },
        }}
      >
        {onOpen && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<ExternalLink size={16} />}
            onClick={onOpen}
            title="Открыть"
            sx={{
              '& .MuiButton-startIcon': {
                marginRight: { xs: 0.5, sm: 1 },
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Открыть
            </Box>
          </Button>
        )}

        {onDelete && (
          <Button
            variant="contained"
            color="error"
            startIcon={<Trash2 size={16} />}
            onClick={onDelete}
            title="Удалить"
            sx={{
              '& .MuiButton-startIcon': {
                marginRight: { xs: 0.5, sm: 1 },
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Удалить
            </Box>
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default HistoryItem;
