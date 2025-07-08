import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import PublicMap from './components/PublicMap';
import AdminMap from './components/AdminMap';
import Login from './components/Login';
import Pricing from './components/Pricing';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CategoriesProvider>
          <Router>
            <Box sx={{ 
              height: '100vh', 
              width: '100vw',
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}>
              <Navigation />
              <Box sx={{ 
                flex: 1, 
                minHeight: 0,
                overflow: 'hidden',
                position: 'relative'
              }}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <PublicMap />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/pricing" 
                    element={
                      <ProtectedRoute>
                        <Pricing />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminMap />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </Box>
            </Box>
          </Router>
        </CategoriesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
