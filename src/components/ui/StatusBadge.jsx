import React from 'react';
import Chip from '@mui/material/Chip';

// Maps semantic variants to themed colors. Used for statuses such as
// Approved / Pending / Rejected across tables and dashboards.
const variantStyles = {
  success: { bg: '#e6f4ea', fg: '#1e6b2c', border: '#bfe3c8' },
  warning: { bg: '#fdf0e1', fg: '#9a5300', border: '#f6d9b3' },
  error: { bg: '#fdeaea', fg: '#b3261e', border: '#f5c2c0' },
  info: { bg: '#e6f1f8', fg: '#0a5a86', border: '#bfdcef' },
  neutral: { bg: '#eef2f6', fg: '#52606d', border: '#d9e2ec' },
};

/**
 * <StatusBadge variant="success" label="Approved" />
 * Optionally infer the variant from common status text via `status`.
 */
const inferVariant = (status = '') => {
  const s = String(status).toLowerCase();
  if (/(approve|active|success|paid|complete|yes)/.test(s)) return 'success';
  if (/(pending|review|progress|partial|waiting)/.test(s)) return 'warning';
  if (/(reject|fail|inactive|cancel|expire|no|error)/.test(s)) return 'error';
  return 'neutral';
};

const StatusBadge = ({ label, status, variant, size = 'small', ...rest }) => {
  const resolved = variant || inferVariant(status ?? label);
  const s = variantStyles[resolved] || variantStyles.neutral;
  return (
    <Chip
      size={size}
      label={label ?? status}
      variant="outlined"
      sx={{
        backgroundColor: s.bg,
        color: s.fg,
        borderColor: s.border,
        fontWeight: 600,
      }}
      {...rest}
    />
  );
};

export default StatusBadge;
