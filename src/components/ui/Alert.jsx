import React from 'react';
import MuiAlert from '@mui/material/Alert';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';

/**
 * Inline, themed alert for form / page feedback.
 * <Alert severity="error">Invalid credentials</Alert>
 */
const Alert = ({ severity = 'info', children, sx, ...rest }) => {
  if (!children) return null;
  return (
    <MuiAlert severity={severity} variant="standard" sx={{ mt: 1, ...sx }} {...rest}>
      {children}
    </MuiAlert>
  );
};

/**
 * Popup notifications — preserves the existing alertifyjs behavior so no
 * existing functionality changes. Use for the same success/error popups
 * pages already rely on.
 */
export const notify = {
  success: (msg, title = 'Success') => alertify.alert(title, msg),
  error: (msg, title = 'Error') => alertify.alert(title, msg),
  warning: (msg, title = 'Warning') => alertify.alert(title, msg),
  info: (msg, title = 'Info') => alertify.alert(title, msg),
};

export default Alert;
