import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Icon from './Icon';

/**
 * Themed modal wrapper over MUI Dialog.
 *
 * <Modal open={open} onClose={...} title="Reset Password" actions={<Button.../>}>
 *   ...body...
 * </Modal>
 */
const Modal = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  ...rest
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth} {...rest}>
      {title && (
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          {title}
          {onClose && (
            <IconButton
              onClick={onClose}
              aria-label="close"
              sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
            >
              <Icon name="close" size={18} />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </DialogContent>
      {actions && <DialogActions sx={{ px: 3, pb: 2.5 }}>{actions}</DialogActions>}
    </Dialog>
  );
};

export default Modal;
