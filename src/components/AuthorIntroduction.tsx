// src/components/AuthorIntroduction.tsx
import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

interface AuthorProps {
  name: string;
  bio: string;
  photoUrl: string;
}

const AuthorIntroduction: React.FC<AuthorProps> = ({ name, bio, photoUrl }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Avatar alt={name} src={photoUrl} sx={{ width: 150, height: 150, mr: 3 }} />
      <Box>
        <Typography variant="h4">{name}</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          {bio}
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthorIntroduction;
