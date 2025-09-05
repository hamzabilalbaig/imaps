import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography,
  Alert,
  Box,
  IconButton
} from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  Warning, 
  Info, 
  Close 
} from '@mui/icons-material';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

const getIconByType = (type) => {
  switch (type) {
    case 'success': return <CheckCircle color="success" />;
    case 'error': return <Error color="error" />;
    case 'warning': return <Warning color="warning" />;
    case 'info': return <Info color="info" />;
    default: return <Info color="primary" />;
  }
};

const getColorByType = (type) => {
  switch (type) {
    case 'success': return 'success';
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    default: return 'primary';
  }
};

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'info', // 'info', 'success', 'error', 'warning', 'confirm'
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null,
    onCancel: null,
    autoClose: false,
    autoCloseDelay: 3000,
  });

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showAlert = useCallback((message, type = 'info', options = {}) => {
    setModalState({
      isOpen: true,
      type,
      title: options.title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'Information'),
      message,
      confirmText: options.confirmText || 'OK',
      cancelText: '',
      showCancel: false,
      onConfirm: options.onConfirm || closeModal,
      onCancel: null,
      autoClose: options.autoClose || false,
      autoCloseDelay: options.autoCloseDelay || 3000,
    });

    if (options.autoClose) {
      setTimeout(() => {
        closeModal();
      }, options.autoCloseDelay || 3000);
    }
  }, [closeModal]);

  const showConfirm = useCallback((message, onConfirm, options = {}) => {
    setModalState({
      isOpen: true,
      type: 'confirm',
      title: options.title || 'Confirm Action',
      message,
      confirmText: options.confirmText || 'Yes',
      cancelText: options.cancelText || 'Cancel',
      showCancel: true,
      onConfirm: () => {
        closeModal();
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        closeModal();
        if (options.onCancel) options.onCancel();
      },
      autoClose: false,
      autoCloseDelay: 0,
    });
  }, [closeModal]);

  const showSuccess = useCallback((message, options = {}) => {
    showAlert(message, 'success', { 
      autoClose: true, 
      autoCloseDelay: 2000,
      ...options 
    });
  }, [showAlert]);

  const showError = useCallback((message, options = {}) => {
    showAlert(message, 'error', options);
  }, [showAlert]);

  const showWarning = useCallback((message, options = {}) => {
    showAlert(message, 'warning', options);
  }, [showAlert]);

  const showInfo = useCallback((message, options = {}) => {
    showAlert(message, 'info', options);
  }, [showAlert]);

  const value = {
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      
      <Dialog
        open={modalState.isOpen}
        onClose={modalState.type === 'confirm' ? modalState.onCancel : modalState.onConfirm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getIconByType(modalState.type)}
            <Typography variant="h6" component="span">
              {modalState.title}
            </Typography>
          </Box>
          <IconButton
            onClick={modalState.type === 'confirm' ? modalState.onCancel : modalState.onConfirm}
            size="small"
            sx={{ color: 'grey.500' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {modalState.type !== 'confirm' ? (
            <Alert 
              severity={getColorByType(modalState.type)}
              sx={{ 
                border: 'none',
                backgroundColor: 'transparent',
                '& .MuiAlert-icon': { display: 'none' },
                '& .MuiAlert-message': { padding: 0 }
              }}
            >
              <Typography variant="body1">
                {modalState.message}
              </Typography>
            </Alert>
          ) : (
            <Typography variant="body1" sx={{ color: 'text.primary' }}>
              {modalState.message}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {modalState.showCancel && (
            <Button
              onClick={modalState.onCancel}
              variant="outlined"
              color="inherit"
              sx={{ 
                minWidth: 80,
                textTransform: 'none'
              }}
            >
              {modalState.cancelText}
            </Button>
          )}
          <Button
            onClick={modalState.onConfirm}
            variant="contained"
            color={modalState.type === 'error' ? 'error' : modalState.type === 'confirm' ? 'primary' : getColorByType(modalState.type)}
            sx={{ 
              minWidth: 80,
              textTransform: 'none'
            }}
            autoFocus
          >
            {modalState.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ModalContext.Provider>
  );
};
