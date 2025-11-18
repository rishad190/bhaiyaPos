import { useState, useCallback } from 'react';

/**
 * Hook for showing confirmation dialogs
 * Returns a confirm function and dialog state
 */
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [resolveReject, setResolveReject] = useState([]);
  const [config, setConfig] = useState({
    title: 'Confirm',
    description: 'Are you sure?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
  });

  const confirm = useCallback((options = {}) => {
    setConfig({
      title: options.title || 'Confirm',
      description: options.description || 'Are you sure?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'default',
    });
    setIsOpen(true);

    return new Promise((resolve, reject) => {
      setResolveReject([resolve, reject]);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveReject[0]) {
      resolveReject[0](true);
    }
  }, [resolveReject]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveReject[1]) {
      resolveReject[1](false);
    }
  }, [resolveReject]);

  return {
    confirm,
    isOpen,
    config,
    handleConfirm,
    handleCancel,
  };
}
