import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

/**
 * A themed content surface for page sections (tables, forms, panels).
 * <PageCard>...</PageCard>
 */
const PageCard = ({ children, sx, padding = 3, ...rest }) => (
  <Card sx={sx} {...rest}>
    <CardContent sx={{ p: padding, '&:last-child': { pb: padding } }}>{children}</CardContent>
  </Card>
);

export default PageCard;
