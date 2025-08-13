import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useUserStore from '../stores/user';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { id, role, loading, initializeUser, isAuthenticated, isUserAdmin } = useUserStore();
  const location = useLocation();

  useEffect(() => {
    initializeUser();
  }, []); // Only run once on mount

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isUserAdmin()) {
    return <Navigate to="/map" replace />;
  }

  return children;
};

export default ProtectedRoute;
