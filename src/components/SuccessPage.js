import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verifyCheckoutSession } from '../api/hooks/useAPI';
import { Container, Typography, Box, CircularProgress, Paper, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function SuccessPage() {
  const { session_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const verifySession = async () => {
    setLoading(true);
    const result = await verifyCheckoutSession(session_id);
    setLoading(false);

    if (result.error) {
      console.error("Error verifying session:", result.error);
      setPaymentStatus('error');
      return;
    }

    setPaymentStatus(result);
  };

  useEffect(() => {
    verifySession();
  }, [session_id]);

  return (
    <Container
    //   maxWidth="sm"
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // bgcolor: '#ffffff',
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, textAlign: 'center', borderRadius: 4 }}>
        {loading ? (
          <Box>
            <CircularProgress sx={{ color: '#1976d2', mb: 2 }} />
            <Typography variant="h6" color="primary">
              Verifying your payment...
            </Typography>
          </Box>
        ) : paymentStatus === 'paid' ? (
          <Box>
            <CheckCircleIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
            <Typography variant="h5" color="primary" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Thank you for your payment! Your subscription is now active.
            </Typography>
            <Button variant="contained" color="primary" href="/" sx={{ mt: 2 }}>
              Go to Maps
            </Button>
          </Box>
        ) : (
          <Box>
            <ErrorOutlineIcon sx={{ fontSize: 60, color: '#d32f2f', mb: 2 }} />
            <Typography variant="h5" color="error" gutterBottom>
              Payment Unsuccessful
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Unfortunately, we couldn't verify your payment. Please try again.
            </Typography>
            <Button variant="outlined" color="primary" href="/pricing" sx={{ mt: 2 }}>
              Return to Pricing
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}