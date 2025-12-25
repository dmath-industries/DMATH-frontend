'use client';
import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Menu, MenuItem, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { AnalyticsEvents } from '@/shared/lib';
import { LanguageSwitcher } from './LanguageSwitcher';

const Header = () => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      suppressHydrationWarning
      sx={{
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        width: '100%',
      }}
      component="header"
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Image src="/images/svg/logo.svg" alt="Logo" width={40} height={40} />
          </Link>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LanguageSwitcher />
          <Box>
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: '1.25rem', opacity: isMenuOpen ? 0.7 : 1 }} />
              <ChevronLeftIcon
                sx={{
                  fontSize: '0.875rem',
                  transition: 'transform 0.3s',
                  transform: isMenuOpen ? 'rotate(-90deg)' : 'rotate(0deg)',
                  opacity: isMenuOpen ? 0.7 : 1,
                }}
              />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              sx={{
                mt: 1,
                '& .MuiPaper-root': {
                  minWidth: 224,
                  backgroundImage: 'linear-gradient(to bottom right, #2a2a2a, #1f1f1f, #151515)',
                  border: '1px solid #3a3a3a',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                  borderRadius: 2,
                },
                '& .MuiList-root': {
                  py: 0.5,
                },
              }}
            >
              <MenuItem
                component={Link}
                href="/"
                onClick={() => {
                  AnalyticsEvents.navigateToAlgorithms('header');
                  handleMenuClose();
                }}
                sx={{
                  px: 3,
                  py: 1.5,
                  color: 'white',
                  borderBottom: '1px solid #3a3a3a',
                  '&:hover': {
                    background:
                      'linear-gradient(to right, rgba(147, 51, 234, 0.2), rgba(37, 99, 235, 0.2))',
                    color: 'rgba(196, 181, 253, 1)',
                  },
                }}
                suppressHydrationWarning
              >
                {t('header.algorithms')}
              </MenuItem>
              <MenuItem
                component={Link}
                href="/history"
                onClick={handleMenuClose}
                sx={{
                  px: 3,
                  py: 1.5,
                  color: 'white',
                  '&:hover': {
                    background:
                      'linear-gradient(to right, rgba(147, 51, 234, 0.2), rgba(37, 99, 235, 0.2))',
                    color: 'rgba(196, 181, 253, 1)',
                  },
                }}
                suppressHydrationWarning
              >
                {t('header.history')}
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
