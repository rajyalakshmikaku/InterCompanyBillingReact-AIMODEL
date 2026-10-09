import React from 'react';
import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { cn } from '../lib/utils';

const buttonVariants = ({ variant = "default" } = {}) => {
  const variants = {
    default: "bg-brand-500 text-white hover:bg-brand-600",
    outline: "border-2 border-brand-500 text-brand-600 hover:bg-brand-50",
    ghost: "text-brand-600 hover:bg-brand-50",
  };
  return variants[variant] || variants.default;
};

const Button = ({
  loading = false,
  disabled,
  children,
  startIcon,
  sx,
  ...rest
}) => (
  <MuiButton
    disabled={disabled || loading}
    startIcon={
      loading ? (
        <CircularProgress
          size={16}
          sx={{ color: '#fff' }}
        />
      ) : startIcon
    }
    sx={{
      ...sx,
      ...(loading && {
        '&.Mui-disabled': {
          color: '#fff !important',
        },
      }),
    }}
    {...rest}
  >
    {children}
  </MuiButton>
);

export default Button;
export { buttonVariants };