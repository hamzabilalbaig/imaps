import React from "react";
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
  useMediaQuery
} from "@mui/material";
import { 
  Map as MapIcon, 
  Settings as SettingsIcon,
  Public as PublicIcon 
} from "@mui/icons-material";

/**
 * Navigation component for switching between public and admin views
 */
function Navigation() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
          
          <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 1 }, flexShrink: 0 }}>
            <Button
              component={Link}
              to="/"
              color="inherit"
              variant={location.pathname === "/" ? "contained" : "text"}
              sx={{
                backgroundColor: location.pathname === "/" ? "rgba(255,255,255,0.2)" : "transparent",
                borderRadius: 2,
                px: { xs: 1, sm: 2, md: 3 },
                py: 1,
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                backdropFilter: location.pathname === "/" ? 'blur(10px)' : 'none',
                border: location.pathname === "/" ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
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
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navigation;
