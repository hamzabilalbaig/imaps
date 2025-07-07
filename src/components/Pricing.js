import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Container,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  WorkspacePremium as PremiumIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    maxPOIs: 3,
    features: [
      '3 Points of Interest',
      'View public maps',
      'Basic map layers',
      'Community support'
    ],
    popular: false,
    color: 'grey'
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$9',
    period: 'month',
    maxPOIs: 10,
    features: [
      '10 Points of Interest',
      'Custom map markers',
      'Export map data',
      'Email support',
      'Priority loading'
    ],
    popular: false,
    color: 'primary'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19',
    period: 'month',
    maxPOIs: 50,
    features: [
      '50 Points of Interest',
      'Advanced map layers',
      'Bulk import/export',
      'Priority support',
      'Custom categories',
      'Analytics dashboard'
    ],
    popular: true,
    color: 'secondary'
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$39',
    period: 'month',
    maxPOIs: 'Unlimited',
    features: [
      'Unlimited Points of Interest',
      'All premium features',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations'
    ],
    popular: false,
    color: 'warning'
  }
];

const Pricing = () => {
  const { user, upgradePlan } = useAuth();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, plan: null });

  const handleUpgrade = (planId) => {
    setConfirmDialog({ open: true, plan: PLANS.find(p => p.id === planId) });
  };

  const confirmUpgrade = () => {
    if (confirmDialog.plan) {
      upgradePlan(confirmDialog.plan.id);
      setConfirmDialog({ open: false, plan: null });
    }
  };

  const isCurrentPlan = (planId) => user?.plan === planId;
  const isDowngrade = (planId) => {
    const currentPlanIndex = PLANS.findIndex(p => p.id === user?.plan);
    const targetPlanIndex = PLANS.findIndex(p => p.id === planId);
    return targetPlanIndex < currentPlanIndex;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Choose Your Plan
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Create more Points of Interest with our flexible pricing plans
          </Typography>
          {user && (
            <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
              Current Plan: <strong>{PLANS.find(p => p.id === user.plan)?.name || 'Free'}</strong>
            </Alert>
          )}
        </Box>

        {/* Pricing Cards */}
        <Grid container spacing={3} justifyContent="center">
          {PLANS.map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Card
                elevation={plan.popular ? 8 : 2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.popular ? 2 : 0,
                  borderColor: 'secondary.main',
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: plan.popular ? 'scale(1.08)' : 'scale(1.03)',
                  }
                }}
              >
                {plan.popular && (
                  <Chip
                    icon={<StarIcon />}
                    label="Most Popular"
                    color="secondary"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontWeight: 'bold'
                    }}
                  />
                )}

                <CardContent sx={{ flex: 1, textAlign: 'center', pt: plan.popular ? 4 : 2 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {plan.name}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" fontWeight="bold" color={`${plan.color}.main`}>
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      per {plan.period}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                    <LocationIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {plan.maxPOIs} POIs
                    </Typography>
                  </Box>

                  <List dense>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <CardActions sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant={isCurrentPlan(plan.id) ? "outlined" : "contained"}
                    color={plan.color}
                    size="large"
                    disabled={isCurrentPlan(plan.id)}
                    onClick={() => handleUpgrade(plan.id)}
                    startIcon={isCurrentPlan(plan.id) ? <CheckIcon /> : <PremiumIcon />}
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                  >
                    {isCurrentPlan(plan.id) 
                      ? 'Current Plan' 
                      : isDowngrade(plan.id) 
                        ? 'Downgrade' 
                        : 'Upgrade'
                    }
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* FAQ or Additional Info */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            All plans include access to basic map features. Upgrade anytime to increase your POI limit.
          </Typography>
        </Box>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, plan: null })}>
        <DialogTitle>
          Confirm Plan Change
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {isDowngrade(confirmDialog.plan?.id) ? 'downgrade' : 'upgrade'} to the{' '}
            <strong>{confirmDialog.plan?.name}</strong> plan?
          </Typography>
          {isDowngrade(confirmDialog.plan?.id) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Downgrading may limit your existing POIs if you exceed the new limit.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, plan: null })}>
            Cancel
          </Button>
          <Button onClick={confirmUpgrade} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pricing;
