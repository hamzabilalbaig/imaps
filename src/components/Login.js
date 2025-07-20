import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  IconButton,
  InputAdornment,
  Divider,
  Chip,
  Tabs,
  Tab,
  ButtonGroup
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Map as MapIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loginType, setLoginType] = useState('user'); // 'admin' or 'user'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, user } = useAuth();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  // If already logged in, redirect
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }
      
      const result = await register(email, password, name, 'user');
      if (!result.success) {
        setError(result.error);
      }
    } else {
      const result = await login(email, password, loginType);
      if (!result.success) {
        setError(result.error);
      }
    }
    
    setLoading(false);
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    if (type === 'admin') {
      setEmail('admin@admin.com');
      setPassword('admin');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
    setLoginType('user');
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      <Container maxWidth="sm">
        <Paper 
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'primary.main',
              borderRadius: 2,
              p: 1.5,
              mb: 2
            }}>
              <MapIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Welcome to iMaps
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {mode === 'register' ? 'Create your user account (Admin accounts are pre-configured)' : 'Sign in to access your account'}
            </Typography>
          </Box>

          {/* Mode Selection Tabs */}
          <Box sx={{ mb: 3 }}>
            <Tabs
              value={mode}
              onChange={(e, newValue) => {
                setMode(newValue);
                resetForm();
              }}
              centered
              variant="fullWidth"
            >
              <Tab value="login" label="Login" icon={<LoginIcon />} />
              <Tab value="register" label="Register" icon={<RegisterIcon />} />
            </Tabs>
          </Box>

          {/* Login Type Selector for Login Mode */}
          {mode === 'login' && (
            <Box sx={{ mb: 3 }}>
              <ButtonGroup fullWidth variant="outlined" sx={{ mb: 2 }}>
                <Button
                  variant={loginType === 'user' ? 'contained' : 'outlined'}
                  onClick={() => handleLoginTypeChange('user')}
                  startIcon={<UserIcon />}
                  sx={{ py: 1.5 }}
                >
                  User Login
                </Button>
                <Button
                  variant={loginType === 'admin' ? 'contained' : 'outlined'}
                  onClick={() => handleLoginTypeChange('admin')}
                  startIcon={<AdminIcon />}
                  sx={{ py: 1.5 }}
                  color="secondary"
                >
                  Admin Login
                </Button>
              </ButtonGroup>
              <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                {loginType === 'admin' 
                  ? 'Admin access with full management capabilities' 
                  : 'Standard user access with POI creation limits'
                }
              </Typography>
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Login/Register Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <TextField
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
                autoComplete="name"
              />
            )}
            
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus={mode === 'login'}
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {mode === 'register' && (
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={mode === 'register' ? <RegisterIcon /> : <LoginIcon />}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold'
              }}
            >
              {loading 
                ? (mode === 'register' ? 'Creating Account...' : 'Signing in...') 
                : (mode === 'register' ? 'Create Account' : 'Sign In')
              }
            </Button>
          </form>

          {mode === 'login' && (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
              Use the buttons above to switch between User and Admin login modes
            </Typography>
          )}

          {mode === 'register' && (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
              Registration creates a regular user account with basic POI limits
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
