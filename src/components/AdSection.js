import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  useTheme,
  alpha 
} from '@mui/material';
import { 
  Upgrade as UpgradeIcon,
  Close as CloseIcon 
} from '@mui/icons-material';

function AdSection({ onClose, showCloseButton = false }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: { xs: 90, sm: 80, md: 20 },
        left: { xs: 8, sm: 16, md: 20 },
        width: { xs: 'calc(100vw - 16px)', sm: 280, md: 300 },
        maxWidth: { xs: 'calc(100vw - 16px)', sm: 300, md: 320 },
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        overflow: 'hidden',
        zIndex: 1000,
        border: `1px solid ${theme.palette.divider}`,
        boxSizing: 'border-box'
      }}
    >
      {showCloseButton && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <Button
            size="small"
            onClick={onClose}
            sx={{ 
              minWidth: 'auto', 
              p: 0.5,
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1)
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </Box>
      )}
      
      <Box sx={{ p: 2, pt: showCloseButton ? 0 : 2 }}>
        {/* Ad Content */}
        <Box 
          sx={{ 
            minHeight: 100,
            backgroundColor: alpha(theme.palette.grey[900], 0.8),
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            Ad removed. Details
          </Typography>
        </Box>

        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: 1
        }}>
          Ad removed? Consider an upgrade to PRO
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ 
          mb: 2,
          fontSize: '0.8rem',
          lineHeight: 1.4
        }}>
          Remove ads and get extra features with our PRO plan.
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<UpgradeIcon />}
          fullWidth
          sx={{
            backgroundColor: theme.palette.secondary.main,
            '&:hover': {
              backgroundColor: theme.palette.secondary.dark
            },
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            py: 1
          }}
        >
          UPGRADE TO PRO
        </Button>

    
      </Box>
    </Paper>
  );
}

export default AdSection;
