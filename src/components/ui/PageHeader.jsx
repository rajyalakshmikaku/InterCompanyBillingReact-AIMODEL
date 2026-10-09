import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * Standard page title block with an optional actions area on the right.
 * <PageHeader title="Customers" subtitle="Manage company customers" actions={<Button.../>} />
 */
const PageHeader = ({ title, subtitle, actions }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: { xs: 'flex-start', sm: 'center' },
      flexDirection: { xs: 'column', sm: 'row' },
      gap: 1.5,
      mb: 2.5,
    }}
  >
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
  </Box>
);

export default PageHeader;
