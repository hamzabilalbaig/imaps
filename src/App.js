import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { ModalProvider } from './contexts/ModalContext';
import useUserStore from './stores/user';
import useSettingsStore from './stores/settings';
import { getPoiSetting } from './api/functions/apiFunctions';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import PublicMap from './components/PublicMap';
import UserMap from './components/UserMap';
import AdminMap from './components/AdminMap';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Pricing from './components/Pricing';
import SuccessPage from './components/SuccessPage';

function App() {
  const { initializeUser } = useUserStore();
  const path = window.location.pathname;
  const [showNavigation, setShowNavigation] = React.useState(true);

  // Initialize user from localStorage on app start
  React.useEffect(() => {
    const initializeApp = async () => {
      await initializeUser();
    };
    initializeApp();
  }, [initializeUser]);

  // Fetch global POI settings from backend and apply to settings store
  // This runs on every app load and overrides any localStorage values
  React.useEffect(() => {
    const applyPoiSettings = async () => {
      try {
        const setting = await getPoiSetting('poi_icon_size');
        if (setting && setting.setting_value) {
          const parsed = parseInt(setting.setting_value, 10);
          if (!Number.isNaN(parsed)) {
            const initializePoiIconSize = useSettingsStore.getState().initializePoiIconSize;
            initializePoiIconSize(parsed);
          }
        }
      } catch (err) {
        // Ignore errors - keep default value from store
        console.warn('Failed to load POI settings from database, using default:', err.message);
      }
    };
    applyPoiSettings();
  }, []);

  React.useEffect(() => {
    if (path === '/login' || path === '/admin-login' || path === '/register' || path === '/forgot-password' || path === '/reset-password') {
      setShowNavigation(false);
    } else {
      setShowNavigation(true);
    }
  }, [path]);
  function checkNavigationToShow() {
    setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/admin-login' || currentPath === '/register' || currentPath === '/forgot-password' || currentPath === '/reset-password') {
        setShowNavigation(false);
      } else {
        setShowNavigation(true);
      }
    }, 1000);
  }
  React.useEffect(() => {
    checkNavigationToShow();
  }, []);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ModalProvider>
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
{
  // path !== '/login' && path !== '/admin-login' && 
  // path?.includes('/login') || path.includes('/admin-login') ? null :
              showNavigation && <Navigation />
              

}
              <Box sx={{ 
                flex: 1, 
                minHeight: 0,
                overflow: 'auto',
                position: 'relative',
              }}>
                <Routes>
                  <Route path="/login" element={<Login loginType="user" />} />
                  <Route path="/register" element={<Login loginType="user" isRegister={true} />} />
                  <Route path="/admin-login" element={<Login loginType="admin" />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route 
                    path="/" 
                    element={<PublicMap />}
                  />
                  <Route 
                    path="/map" 
                    element={
                      <ProtectedRoute>
                        <UserMap />
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
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin-map" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminMap />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/success/:session_id/:plan"
                    element={
                      <ProtectedRoute>
                        <SuccessPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Box>
            </Box>
          </Router>
        </CategoriesProvider>
      </AuthProvider>
      </ModalProvider>
    </ThemeProvider>
  );
}

export default App;
