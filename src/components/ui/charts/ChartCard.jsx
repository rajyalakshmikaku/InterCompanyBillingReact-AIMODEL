import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

/**
 * Shared shell for all charts: a titled Card with a fixed-height responsive area.
 * The concrete chart components render their recharts tree as children.
 */
const ChartCard = ({ title, subtitle, height = 300, action, children }) => (
  <Card>
    <CardContent>
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            {title && (
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}
      <Box sx={{ width: '100%', height }}>{children}</Box>
    </CardContent>
  </Card>
);

export default ChartCard;
