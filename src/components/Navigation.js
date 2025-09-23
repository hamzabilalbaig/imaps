// Replace all checks for `user` with `isLoggedIn` state
// Also, update isLoggedIn when user.id changes

import React, { useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Container
} from "@mui/material";

/**
 * Navigation component for switching between public and admin views
 */
function Navigation() {

  return (
    <AppBar 
      position="static" 
      color="primary" 
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'none' // Hidden for now, can be needed later maybe
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64, md: 70 }, px: { xs: 1, sm: 2 } }}>
          
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navigation;
