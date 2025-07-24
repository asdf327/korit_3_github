// src/components/WorkDetail.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface WorkDetailProps {
  title: string;
  content: string;
}

const WorkDetail: React.FC<WorkDetailProps> = ({ title, content }) => {
  return (
    <Box sx={{ mt: 4, mx: 3 }}>
      <Typography variant="h5">{title}</Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">{content}</Typography>
      </Paper>
    </Box>
  );
};

export default WorkDetail;
