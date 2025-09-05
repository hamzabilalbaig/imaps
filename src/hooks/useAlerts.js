import { useModal } from '../contexts/ModalContext';

// Custom hook that provides alert and confirm replacements
export const useAlerts = () => {
  const modal = useModal();

  // Replace window.alert()
  const alert = (message, type = 'info', options = {}) => {
    modal.showAlert(message, type, options);
  };

  // Replace window.confirm()
  const confirm = (message, onConfirm, options = {}) => {
    return new Promise((resolve) => {
      modal.showConfirm(message, () => {
        resolve(true);
        if (onConfirm) onConfirm();
      }, {
        ...options,
        onCancel: () => {
          resolve(false);
          if (options.onCancel) options.onCancel();
        }
      });
    });
  };

  // Convenience methods
  const success = (message, options = {}) => {
    modal.showSuccess(message, options);
  };

  const error = (message, options = {}) => {
    modal.showError(message, options);
  };

  const warning = (message, options = {}) => {
    modal.showWarning(message, options);
  };

  const info = (message, options = {}) => {
    modal.showInfo(message, options);
  };

  return {
    alert,
    confirm,
    success,
    error,
    warning,
    info,
  };
};

// For legacy components, provide global replacements
export const setupGlobalAlerts = (modal) => {
  // Store original functions
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;

  // Replace with modal versions
  window.alert = (message) => {
    modal.showAlert(message, 'info');
  };

  window.confirm = (message) => {
    return new Promise((resolve) => {
      modal.showConfirm(message, () => resolve(true), {
        onCancel: () => resolve(false)
      });
    });
  };

  // Return cleanup function
  return () => {
    window.alert = originalAlert;
    window.confirm = originalConfirm;
  };
};
