// src/components/WorkList.tsx
import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, } from '@mui/material';
import { Link } from 'react-router-dom';

interface Work {
  id: string;
  title: string;
}

const WorkList: React.FC<{ works: Work[] }> = ({ works }) => {
  return (
    <Box sx={{ mt: 4, mx: 3 }}>
      <Typography variant="h5">탕현조의 작품들</Typography>
      <List>
        {works.map((work) => (
          <ListItem key={work.id} component={Link} to={`/works/${work.id}`}>
            <ListItemText primary={work.title} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default WorkList;
