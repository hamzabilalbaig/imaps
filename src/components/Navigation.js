// Replace all checks for `user` with `isLoggedIn` state
// Also, update isLoggedIn when user.id changes

import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  Chip,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Divider
} from "@mui/material";
import { 
  Map as MapIcon, 
  Settings as SettingsIcon,
  Public as PublicIcon,
  AttachMoney as PricingIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext"; // Keep for now
import useUserStore from "../stores/user";

/**
 * Navigation component for switching between public and admin views
 */
function Navigation() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useUserStore(state => state);
  const [anchorEl, setAnchorEl] = React.useState(null);

  React.useEffect(() => {
    initializeUser();
  }, []); // Only run once on mount

  // const user = { id, name, email, role };
  const { id, name, email, role, logout, initializeUser, isUserAdmin } = user;

  const isAdmin = isUserAdmin();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  // Use isLoggedIn state and update when user.id changes
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  React.useEffect(() => {
    setIsLoggedIn(id !== null);
    console.log('User:', user);
  }, [id]);

  return (
    <AppBar 
      position="static" 
      color="primary" 
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64, md: 70 }, px: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1, md: 3 }, flex: { xs: 1, md: 'none' } }}>
            <Box
              sx={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                p: { xs: 0.75, md: 1 },
                mr: { xs: 1, sm: 2 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MapIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 }, color: 'white' }} />
            </Box>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="div"
              sx={{ 
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.025em',
                fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }
              }}
            >
              iMaps
            </Typography>
            
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 1 }, alignItems: 'center', flexShrink: 0 }}>
            {/* Remove Public View button when on public map */}
            {location.pathname !== '/' && (
              <Button
                component={Link}
                to={isLoggedIn ? "/map" : "/"}
                color="inherit"
                variant={location.pathname === "/" || location.pathname === "/map" ? "contained" : "text"}
                sx={{
                  backgroundColor: location.pathname === "/" || location.pathname === "/map" ? "rgba(255,255,255,0.2)" : "transparent",
                  borderRadius: 2,
                  px: { xs: 1, sm: 2, md: 3 },
                  py: 1,
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  backdropFilter: location.pathname === "/" || location.pathname === "/map" ? 'blur(10px)' : 'none',
                  border: location.pathname === "/" || location.pathname === "/map" ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: "rgba(255,255,255,0.15)",
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }
                }}
                startIcon={!isMobile ? <PublicIcon /> : null}
              >
                {isMobile ? "Public" : "Public View"}
              </Button>
            )}
            
            {/* Show Admin Panel for admins, Pricing for regular users - only when authenticated */}
            {isLoggedIn && (isAdmin ? (
              <Button
                component={Link}
                to="/admin"
                color="inherit"
                variant={location.pathname === "/admin" ? "contained" : "text"}
                sx={{
                  backgroundColor: location.pathname === "/admin" ? "rgba(255,255,255,0.2)" : "transparent",
                  borderRadius: 2,
                  px: { xs: 1, sm: 2, md: 3 },
                  py: 1,
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  backdropFilter: location.pathname === "/admin" ? 'blur(10px)' : 'none',
                  border: location.pathname === "/admin" ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: "rgba(255,255,255,0.15)",
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }
                }}
                startIcon={!isMobile ? <SettingsIcon /> : null}
              >
                {isMobile ? "Admin" : "Admin Panel"}
              </Button>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/pricing"
                  color="inherit"
                  variant={location.pathname === "/pricing" ? "contained" : "text"}
                  sx={{
                    backgroundColor: location.pathname === "/pricing" ? "rgba(255,255,255,0.2)" : "transparent",
                    borderRadius: 2,
                    px: { xs: 1, sm: 2, md: 3 },
                    py: 1,
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                    backdropFilter: location.pathname === "/pricing" ? 'blur(10px)' : 'none',
                    border: location.pathname === "/pricing" ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                    '&:hover': {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }
                  }}
                  startIcon={!isMobile ? <PricingIcon /> : null}
                >
                  {isMobile ? "Pricing" : "Pricing"}
                </Button>
              </>
            ))}

            {/* Authentication buttons for non-authenticated users */}
            {!isLoggedIn && (
              <>
                <Button
                  component={Link}
                  to="/login"
                  color="inherit"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    borderRadius: 2,
                    px: { xs: 1.5, sm: 2, md: 3 },
                    py: 1,
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                    '&:hover': {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      borderColor: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)'
                    }
                  }}
                  startIcon={!isMobile ? <PersonIcon /> : null}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  color="inherit"
                  variant="contained"
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 2,
                    px: { xs: 1.5, sm: 2, md: 3 },
                    py: 1,
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      backgroundColor: "rgba(255,255,255,0.3)",
                      border: '1px solid rgba(255,255,255,0.5)'
                    }
                  }}
                  startIcon={!isMobile ? <PersonAddIcon /> : null}
                >
                  Register
                </Button>
              </>
            )}

            {/* User Menu */}
            {isLoggedIn && (
              <>
                <IconButton
                  size="large"
                  onClick={handleMenu}
                  color="inherit"
                  sx={{
                    ml: 1,
                    '&:hover': {
                      backgroundColor: "rgba(255,255,255,0.2)",
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: 'secondary.main',
                      fontSize: '0.875rem'
                    }}
                  >
                    {user.name?.charAt(0) || user.email?.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    <Chip 
                      label={user.plan || 'Free'} 
                      size="small" 
                      color={user.role === 'admin' ? 'error' : 'primary'}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navigation;
