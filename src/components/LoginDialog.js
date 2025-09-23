import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  IconButton
} from '@mui/material';
import {
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LoginDialog = ({ open, onClose, onSuccess }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
  };

  const handleLogin = () => {
    handleClose();
    navigate('/login');
  };

  const handleRegister = () => {
    handleClose();
    navigate('/register');
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          minHeight: '300px'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" fontWeight="bold">
          Login/Register to Proceed
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          To suggest locations, add notes, or create POIs, you need to be logged in. Please sign in or create an account to continue.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            sx={{ py: 1.5, textTransform: 'none', fontWeight: 'bold' }}
          >
            Sign In
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<RegisterIcon />}
            onClick={handleRegister}
            sx={{ py: 1.5, textTransform: 'none', fontWeight: 'bold' }}
          >
            Create Account
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;