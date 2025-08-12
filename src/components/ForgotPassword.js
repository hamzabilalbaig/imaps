import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { requestPasswordReset } from '../api/functions/apiFunctions';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    const result = await requestPasswordReset(email);
    if (result.success) {
      setEmailSent(true);
      setMessage('Password reset email sent successfully!');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (emailSent) {
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
              background: 'rgba(255, 255, 255, 0.95)',
              textAlign: 'center'
            }}
          >
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'success.main',
              borderRadius: 2,
              p: 1.5,
              mb: 3
            }}>
              <EmailIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            
            <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
              Check Your Email
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We've sent a password reset link to <strong>{email}</strong>
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Please check your email and click the link to reset your password. 
              If you don't see the email, check your spam folder.
            </Typography>
            
            <Button
              onClick={handleBackToLogin}
              variant="contained"
              startIcon={<ArrowBackIcon />}
              sx={{ 
                borderRadius: 2,
                fontWeight: 'bold'
              }}
            >
              Back to Login
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
            <IconButton
              onClick={handleBackToLogin}
              sx={{ 
                position: 'absolute', 
                top: 16, 
                left: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            
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
              Forgot Password?
            </Typography>
            
            <Typography variant="body1" color="text.secondary">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </Typography>
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              placeholder="Enter your email address"
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {message && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {message}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={<EmailIcon />}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#667eea', 
                  textDecoration: 'none', 
                  fontWeight: 'bold' 
                }}
              >
                Back to Login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
