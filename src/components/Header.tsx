// src/components/Header.tsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="fixed" sx={{ backgroundColor: '#6d4c41' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* 왼쪽: 뒤로 가기 */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff' }}>
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* 오른쪽: 홈 / 작가 목록 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            to="/"
            color="inherit"
            startIcon={<HomeIcon />}
          >
            
          </Button>
          <Button
            component={Link}
            to="/works"
            color="inherit"
            startIcon={<ImportContactsIcon />}
          >
            
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
